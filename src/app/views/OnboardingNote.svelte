<script lang="ts">
  import {onMount} from "svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Heading from "src/partials/Heading.svelte"

  export let signup
  export let setStage

  let compose = null

  const prev = () => setStage("follows")
  const next = () => signup(compose.parse())
  const skip = () => signup()

  onMount(() => {
    compose.write("Hello world! #introductions")
  })
</script>

<Heading class="text-center">Welcome to Nostr</Heading>
<p>
  Your're all set! If have any questions, just ask! People around these parts are always ready to
  lend a hand.
</p>
<div class="border-l-2 border-solid border-mid pl-4">
  <Compose bind:this={compose} onSubmit={next} />
</div>
<div class="flex gap-2">
  <Anchor theme="button" on:click={prev}><i class="fa fa-arrow-left" /></Anchor>
  <Anchor theme="button-accent" class="flex-grow text-center" on:click={next}>Say Hello!</Anchor>
</div>
<Anchor class="text-center" on:click={skip}>
  Skip and see your feed <i class="fa fa-arrow-right" />
</Anchor>
