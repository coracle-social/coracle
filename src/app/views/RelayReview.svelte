<script lang="ts">
  import {onDestroy} from "svelte"
  import {noop} from "@welshman/lib"
  import {makeEvent} from "@welshman/util"
  import {thunks, userRelays} from "src/engine/core"
  import Button from "src/partials/Button.svelte"
  import Content from "src/partials/Content.svelte"
  import AltColor from "src/partials/AltColor.svelte"
  import Heading from "src/partials/Heading.svelte"
  import EditorContent from "src/app/editor/EditorContent.svelte"
  import Rating from "src/partials/Rating.svelte"
  import {router} from "src/app/util/router"
  import {getClientTags} from "src/engine"
  import {makeEditor} from "src/app/editor"

  export let url

  let rating

  const onSubmit = () => {
    const content = editor.getText({blockSeparator: "\n"}).trim()

    // Build the event before popping, since that tears the editor down
    const event = makeEvent(1986, {
      content,
      tags: [
        ...getClientTags(),
        ...editor.storage.nostr.getEditorTags(),
        ["L", "review"],
        ["l", "review/relay", "review"],
        // Rating is a number from 0 to 1, but tag values have to be strings
        ["rating", String(rating)],
        ["r", url],
      ],
    })

    // Relay selection is async now, so publish once it resolves rather than making the user wait
    userRelays()
      .then(relays => thunks.get().publish({event, relays}))
      .catch(noop)

    router.pop()
  }

  const editor = makeEditor({
    autofocus: true,
    placeholder: "Write a review...",
    submit: onSubmit,
  })

  onDestroy(() => {
    editor.destroy()
  })
</script>

<form on:submit|preventDefault={onSubmit}>
  <Content size="lg">
    <Heading class="text-center">Leave a review</Heading>
    <div class="flex w-full flex-col gap-4">
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between gap-2">
          <strong>Your rating:</strong>
          <Rating bind:value={rating} />
        </div>
      </div>
      <AltColor background class="overflow-hidden rounded">
        <EditorContent {editor} class="min-h-24 bg-white p-3 text-black" />
      </AltColor>
      <Button class="btn flex-grow" type="submit">Send</Button>
    </div>
  </Content>
</form>
