<script lang="ts">
  import {ctx} from "@welshman/lib"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import Rating from "src/partials/Rating.svelte"
  import {router} from "src/app/util/router"
  import {createAndPublish, getClientTags, tagsFromContent} from "src/engine"
  import {Editor} from "svelte-tiptap"
  import {getEditorOptions} from "src/app/editor"
  import {onMount} from "svelte"

  export let url

  let editor: Editor
  let element: HTMLElement
  let rating

  const onSubmit = () => {
    const content = editor.getText()

    createAndPublish({
      relays: ctx.app.router.FromUser().getUrls(),
      kind: 1986,
      content,
      tags: [
        ...getClientTags(),
        ...tagsFromContent(content),
        ["L", "review"],
        ["l", "review/relay", "review"],
        ["rating", rating],
        ["r", url],
      ],
    })

    router.pop()
  }

  onMount(() => {
    editor = new Editor(
      getEditorOptions({
        submit: onSubmit,
        element,
        submitOnEnter: true,
        autofocus: true,
      }),
    )
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
      <Compose
        {editor}
        bind:element
        class="shadow-inset rounded bg-tinted-200 px-2 py-2 text-black"
        style="min-height: 6rem" />
      <Anchor button tag="button" type="submit" class="flex-grow">Send</Anchor>
    </div>
  </Content>
</form>
