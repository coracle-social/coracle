<script lang="ts">
  import {onMount} from "svelte"
  import {inc} from "ramda"
  import {now} from "@coracle.social/lib"
  import {Tags, decodeAddress, asEventTemplate} from "@coracle.social/util"
  import {sleep} from "hurdak"
  import {secondsToDate, dateToSeconds} from "src/util/misc"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import DateTimeInput from "src/partials/DateTimeInput.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import NoteImages from "src/app/shared/NoteImages.svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import {router} from "src/app/router"
  import {toastProgress} from "src/app/state"
  import {dereferenceNote, publishToZeroOrMoreGroups} from "src/engine"

  export let address
  export let event

  const onSubmit = async () => {
    const tags = Tags.fromEvent(event)
      .setTag("title", values.title)
      .setTag("location", values.location)
      .setTag("start", dateToSeconds(values.start).toString())
      .setTag("end", dateToSeconds(values.end).toString())
      .setIMeta(images.getValue())
      .removeContext()

    const template = asEventTemplate({
      ...event,
      tags: tags.unwrap(),
      content: compose.parse(),
      created_at: inc(event.created_at),
    })

    const {pubs} = await publishToZeroOrMoreGroups(values.groups, template)

    pubs[0].on("progress", toastProgress)

    router.pop()
  }

  let loading = true
  let images, compose
  let values: any = {}

  onMount(async () => {
    if (!event) {
      event = await dereferenceNote(decodeAddress(address, []))
    }

    loading = false

    if (event) {
      const tags = Tags.fromEvent(event)

      values = {
        groups: tags.context().values().valueOf(),
        title: tags.get("name")?.value() || tags.get("title")?.value() || "",
        location: tags.get("location")?.value() || "",
        start: secondsToDate(tags.get("start")?.value() || now()),
        end: secondsToDate(tags.get("end")?.value() || now()),
      }

      // Wait for components to mount
      await sleep(10)

      compose.write(event.content)

      for (const url of tags.values("image").valueOf()) {
        images.addImage(Tags.wrap([["url", url]]))
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
      <div class="grid grid-cols-2 gap-2">
        <div class="flex flex-col gap-1">
          <strong>Start</strong>
          <DateTimeInput bind:value={values.start} />
        </div>
        <div class="flex flex-col gap-1">
          <strong>End</strong>
          <DateTimeInput bind:value={values.end} />
        </div>
      </div>
      <Field label="Location (optional)">
        <Input bind:value={values.location} />
      </Field>
      <Field label="Description">
        <div class="rounded-xl border border-solid border-neutral-600 bg-white p-3 text-black">
          <Compose autofocus bind:this={compose} {onSubmit} />
        </div>
      </Field>
      <NoteImages bind:this={images} bind:compose includeInContent />
      <div class="flex gap-2">
        <Anchor button tag="button" type="submit" class="flex-grow">Save</Anchor>
        <ImageInput multi hostLimit={3} on:change={e => images?.addImage(e.detail)} />
      </div>
    </FlexColumn>
  </form>
{/if}
