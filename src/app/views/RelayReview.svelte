<script lang="ts">
  import {ctx} from "@welshman/lib"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import EditorContent from "src/app/editor/EditorContent.svelte"
  import Rating from "src/partials/Rating.svelte"
  import {router} from "src/app/util/router"
  import {createAndPublish, getClientTags} from "src/engine"
  import {makeEditor} from "src/app/editor"

  export let url

  let rating

  const onSubmit = () => {
    const content = editor.getText({blockSeparator: "\n"}).trim()

    createAndPublish({
      relays: ctx.app.router.FromUser().getUrls(),
      kind: 1986,
      content,
      tags: [
        ...getClientTags(),
        ...editor.storage.nostr.getEditorTags(),
        ["L", "review"],
        ["l", "review/relay", "review"],
        ["rating", rating],
        ["r", url],
      ],
    })

    router.pop()
  }

  const editor = makeEditor({
    autofocus: true,
    placeholder: "Write a review...",
    submit: onSubmit,
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
      <EditorContent
        {editor}
        class="shadow-inset rounded bg-tinted-200 px-2 py-2 text-black"
        style="min-height: 6rem" />
      <Anchor button tag="button" type="submit" class="flex-grow">Send</Anchor>
    </div>
  </Content>
</form>
