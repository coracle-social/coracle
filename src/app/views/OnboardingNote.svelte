<script lang="ts">
  import {onMount} from "svelte"
  import {ctx} from "@welshman/lib"
  import {NOTE} from "@welshman/util"
  import Compose from "src/app/shared/Compose.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {createAndPublish, tagsFromContent} from "src/engine"

  export let signup
  export let setStage

  let loading = false
  let compose = null

  const prev = () => setStage("follows")

  const skip = () => signup()

  const next = async () => {
    loading = true

    try {
      const content = compose.parse()

      // Publish our welcome note
      if (content) {
        await createAndPublish({
          kind: NOTE,
          content,
          tags: tagsFromContent(content),
          relays: ctx.app.router.WriteRelays().getUrls(),
        })
      }

      signup()
    } finally {
      loading = false
    }
  }

  onMount(() => {
    compose.write("Hello world! #introductions")
  })
</script>

<div class="flex gap-3">
  <p
    class="-ml-1 -mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-lg">
    5/5
  </p>
  <p class="text-2xl font-bold">You're all set!</p>
</div>
<p>
  If you have any questions, just use the #asknostr hashtag — people are always happy to lend a
  hand.
</p>
<p>Now is a great time to introduce yourself to the Nostr network!</p>
<div class="border-l-2 border-solid border-neutral-600 pl-4">
  <Compose autofocus bind:this={compose} onSubmit={next} />
</div>
<div class="flex gap-2">
  <Anchor button on:click={prev}><i class="fa fa-arrow-left" /> Back</Anchor>
  <Anchor button accent class="flex-grow text-center" {loading} on:click={next}>Say Hello</Anchor>
</div>
<Anchor class="text-center" on:click={skip}>
  Skip and see your feed <i class="fa fa-arrow-right" />
</Anchor>
