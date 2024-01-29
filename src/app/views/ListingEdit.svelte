<script lang="ts">
  import {onMount} from "svelte"
  import {Tags, now} from "paravel"
  import {sleep, ucFirst} from "hurdak"
  import {whereEq} from "ramda"
  import {Naddr, EventBuilder} from "src/util/nostr"
  import {currencyOptions} from "src/util/i18n"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Field from "src/partials/Field.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Input from "src/partials/Input.svelte"
  import CurrencySymbol from "src/partials/CurrencySymbol.svelte"
  import CurrencyInput from "src/partials/CurrencyInput.svelte"
  import SelectButton from "src/partials/SelectButton.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import NoteImages from "src/app/shared/NoteImages.svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import {router} from "src/app/router"
  import {toastProgress} from "src/app/state"
  import {dereferenceNote, publishToZeroOrMoreGroups, getUserRelayUrls} from "src/engine"

  export let address
  export let event

  const onSubmit = async () => {
    const builder = EventBuilder.from(event)
    const priceTag = [values.price.toString(), values.currency.code]

    if (values.frequency) {
      priceTag.push(values.frequency)
    }

    builder.setTag("title", values.title)
    builder.setTag("summary", values.summary)
    builder.setTag("location", values.location)
    builder.setTag("price", ...priceTag)

    if (values.status !== 'active') {
      builder.setTag("status", values.status)
    }

    builder.removeCircles()
    builder.setCreatedAt(now())
    builder.setContent(compose.parse())
    builder.setImages(images.getValue())

    const {pubs} = await publishToZeroOrMoreGroups(values.groups, builder.template, {
      relays: getUserRelayUrls("write"),
    })

    pubs[0].on("progress", toastProgress)

    router.pop()
  }

  let loading = true
  let images, compose
  let values: any = {}

  onMount(async () => {
    if (!event) {
      event = await dereferenceNote(Naddr.fromTagValue(address))
    }

    loading = false

    if (event) {
      const tags = Tags.from(event)
      const [price, code, frequency] = tags.type("price").first().slice(1)
      const defaultCurrency = currencyOptions.find(whereEq({code: "SAT"}))
      const currency = currencyOptions.find(whereEq({code})) || defaultCurrency

      values = {
        groups: tags.circles().all(),
        title: tags.getValue("title") || "",
        summary: tags.getValue("summary") || "",
        location: tags.getValue("location") || "",
        status: tags.getValue("status") || "active",
        price: parseInt(price || 0),
        currency,
        frequency,
      }

      // Wait for components to mount
      await sleep(10)

      compose.write(event.content)

      for (const image of tags.type("image").values().all()) {
        images.addImage(new Tags([["url", image]]))
      }
    }
  })
</script>

{#if loading}
  <Spinner />
{:else}
  <form on:submit|preventDefault={() => onSubmit()}>
    <FlexColumn>
      <Field label="Title">
        <Input bind:value={values.title} />
      </Field>
      <Field label="Summary">
        <Input bind:value={values.summary} />
      </Field>
      <Field label="Price">
        <div class="grid grid-cols-3 gap-2">
          <div class="col-span-2">
            <Input type="number" placeholder="0" bind:value={values.price}>
              <span slot="before">
                <CurrencySymbol code={values.currency?.code || "SAT"} />
              </span>
            </Input>
          </div>
          <div class="relative">
            <CurrencyInput bind:value={values.currency} />
          </div>
        </div>
      </Field>
      <Field label="Location (optional)">
        <Input bind:value={values.location} />
      </Field>
      <Field label="Description">
        <div class="rounded-xl border border-solid border-mid bg-white p-3 text-black">
          <Compose autofocus bind:this={compose} {onSubmit} />
        </div>
      </Field>
      <NoteImages bind:this={images} bind:compose />
      <FieldInline label="Status">
        <SelectButton bind:value={values.status} options={["active", "sold"]} displayOption={ucFirst} />
      </FieldInline>
      <div class="flex gap-2">
        <Anchor button tag="button" type="submit" class="flex-grow">Save</Anchor>
        <ImageInput
          multi
          hostLimit={3}
          circle={false}
          on:change={e => images?.addImage(e.detail)} />
      </div>
    </FlexColumn>
  </form>
{/if}
