<script lang="ts">
  import {Tags, asStampedEvent} from "@welshman/util"
  import {ucFirst} from "hurdak"
  import {inc} from "ramda"
  import {getCurrencyOption} from "src/util/i18n"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Field from "src/partials/Field.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Input from "src/partials/Input.svelte"
  import CurrencySymbol from "src/partials/CurrencySymbol.svelte"
  import CurrencyInput from "src/partials/CurrencyInput.svelte"
  import SelectButton from "src/partials/SelectButton.svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import {router} from "src/app/util/router"
  import {deriveEvent, publishToZeroOrMoreGroups} from "src/engine"
  import {Editor} from "svelte-tiptap"
  import {getEditorOptions} from "src/app/editor"

  export let address

  let editor: Editor
  let editorElement: HTMLElement

  const event = deriveEvent(address)

  const onSubmit = async () => {
    if (editor.storage.fileUpload.loading) return

    const tags = Tags.fromEvent($event)
      .setTag("title", values.title)
      .setTag("summary", values.summary)
      .setTag("location", values.location)
      .setTag("price", values.price.toString(), values.currency.code)
      .setTag("status", values.status)
      // .setImages(images.getValue())
      .removeContext()

    const template = asStampedEvent({
      ...$event,
      tags: [...tags.unwrap(), ...editor.commands.getMetaTags()],
      content: editor.getText(),
      created_at: inc($event.created_at),
    })

    publishToZeroOrMoreGroups(values.groups, template)
    router.pop()
  }

  let loading = true
  let values: any = {}

  function edit() {
    console.log(edit)
    const tags = Tags.fromEvent($event)
    const [price, code] = tags.whereKey("price").first().slice(1).valueOf()

    values = {
      groups: tags.context().values().valueOf(),
      title: tags.get("title")?.value() || "",
      summary: tags.get("summary")?.value() || "",
      location: tags.get("location")?.value() || "",
      status: tags.get("status")?.value() || "active",
      price: parseInt(price || "0"),
      currency: getCurrencyOption(code),
    }

    editor = new Editor(
      getEditorOptions({
        submit: onSubmit,
        element: editorElement,
        content: $event.content || "",
        submitOnEnter: true,
        autofocus: true,
      }),
    )
  }

  $: loading = !$event

  $: editorElement && edit()
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
        <div class="rounded-xl border border-solid border-neutral-600 bg-white p-3 text-black">
          <Compose bind:element={editorElement} {editor} class="min-h-24" />
        </div>
      </Field>
      <FieldInline label="Status">
        <SelectButton
          bind:value={values.status}
          options={["active", "sold"]}
          displayOption={ucFirst} />
      </FieldInline>
      <div class="flex gap-2">
        <Anchor button tag="button" type="submit" class="flex-grow">Save</Anchor>
        <button
          class="hover:bg-white-l staatliches flex h-7 w-7 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded bg-white px-6 text-xl text-black transition-all"
          on:click|preventDefault={editor.commands.selectFiles}>
          <i class="fa fa-paperclip" />
        </button>
      </div>
    </FlexColumn>
  </form>
{/if}
