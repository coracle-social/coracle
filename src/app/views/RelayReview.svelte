<script lang="ts">
  import {onDestroy} from "svelte"
  import {makeEvent} from "@welshman/util"
  import {Router, addMaximalFallbacks} from "@welshman/router"
  import {publishThunk} from "@welshman/app"
  import Anchor from "src/partials/Anchor.svelte"
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

    publishThunk({
      relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
      event: makeEvent(1986, {
        content,
        tags: [
          ...getClientTags(),
          ...editor.storage.nostr.getEditorTags(),
          ["L", "review"],
          ["l", "review/relay", "review"],
          ["rating", rating],
          ["r", url],
        ],
      }),
    })

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
      <Anchor button tag="button" type="submit" class="flex-grow">Send</Anchor>
    </div>
  </Content>
</form>
