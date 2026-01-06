<script lang="ts">
  import {onDestroy} from "svelte"
  import {Router, addMaximalFallbacks} from "@welshman/router"
  import {NOTE, makeEvent, own} from "@welshman/util"
  import {publishThunk} from "@welshman/app"
  import {makePow} from "src/util/pow"
  import EditorContent from "src/app/editor/EditorContent.svelte"
  import Button from "src/partials/Button.svelte"
  import {makeEditor} from "src/app/editor"

  export let state
  export let signup
  export let setStage

  const prev = () => setStage("follows")

  const skip = () => signup()

  const next = async () => {
    loading = true

    try {
      const content = editor.getText({blockSeparator: "\n"}).trim()

      // Publish our welcome note
      if (content) {
        const relays = Router.get().FromUser().policy(addMaximalFallbacks).getUrls()
        const template = makeEvent(NOTE, {content, tags: editor.storage.nostr.getEditorTags()})
        const event = await makePow(own(template, state.pubkey), 20).result

        await publishThunk({event, relays})
      }

      signup()
    } finally {
      loading = false
    }
  }

  const editor = makeEditor({
    submit: next,
    autofocus: true,
    content: "Hello world! #introductions",
  })

  let loading = false

  onDestroy(() => {
    editor.destroy()
  })
</script>

<div class="flex gap-3">
  <p
    class="-ml-1 -mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-lg">
    4/4
  </p>
  <p class="text-2xl font-bold">You're all set!</p>
</div>
<p>
  If you have any questions, just use the #asknostr hashtag — people are always happy to lend a
  hand.
</p>
<p>Now is a great time to introduce yourself to the Nostr network!</p>
<div class="border-l-2 border-solid border-neutral-600 pl-4">
  <EditorContent {editor} class="min-h-24" />
</div>
<div class="flex gap-2">
  <Button class="btn" on:click={prev}><i class="fa fa-arrow-left" /> Back</Button>
  <Button class="btn btn-accent flex-grow text-center" {loading} on:click={next}>Say Hello</Button>
</div>
{#if loading}
  <p class="text-center">Hang on tight, we're calculating proof of work...</p>
{:else}
  <Button class="text-center" on:click={skip}>
    Skip and see your feed <i class="fa fa-arrow-right" />
  </Button>
{/if}
