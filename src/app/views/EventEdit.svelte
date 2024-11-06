<script lang="ts">
  import {inc} from "ramda"
  import {now} from "@welshman/lib"
  import {Tags, asStampedEvent} from "@welshman/util"
  import {secondsToDate, dateToSeconds} from "src/util/misc"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import DateTimeInput from "src/partials/DateTimeInput.svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import {router} from "src/app/util/router"
  import {deriveEvent, signAndPublish} from "src/engine"
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
      .setTag("location", values.location)
      .setTag("start", dateToSeconds(values.start).toString())
      .setTag("end", dateToSeconds(values.end).toString())

    const template = asStampedEvent({
      ...$event,
      tags: [...tags.unwrap(), ...editor.commands.getMetaTags()],
      content: editor.getText(),
      created_at: inc($event.created_at),
    })

    signAndPublish(template)
    router.pop()
  }

  let loading = true
  let values: any = {}

  function edit() {
    const tags = Tags.fromEvent($event)

    values = {
      title: tags.get("name")?.value() || tags.get("title")?.value() || "",
      location: tags.get("location")?.value() || "",
      start: secondsToDate(tags.get("start")?.value() || now()),
      end: secondsToDate(tags.get("end")?.value() || now()),
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

  // eslint-disable-next-line
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
          <Compose bind:element={editorElement} {editor} class="min-h-24" />
        </div>
      </Field>
      <div class="flex gap-2">
        <Anchor button tag="button" type="submit" class="flex-grow">Save</Anchor>
        <button
          class="hover:bg-white-l staatliches flex h-7 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded bg-white px-6 text-xl text-black transition-all"
          on:click|preventDefault={editor.commands.selectFiles}>
          <i class="fa fa-upload" />
        </button>
      </div>
    </FlexColumn>
  </form>
{/if}
