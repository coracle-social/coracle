<script lang="ts">
  import {onMount} from "svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"

  export let signup

  let compose = null

  const onSubmit = () => {
    signup(compose.parse())
  }

  const skip = () => signup()

  onMount(() => {
    compose.write("Hello world! #introductions")
  })
</script>

<Content size="lg">
  <Heading class="text-center">Welcome to Nostr</Heading>
  <p class="text-center">
    Your're all set! If have any questions, just ask! People around these parts are always ready to
    lend a hand.
  </p>
  <div class="border-l-2 border-solid border-gray-6 pl-4">
    <Compose bind:this={compose} {onSubmit} />
  </div>
  <Anchor theme="button-accent" class="flex-grow text-center" on:click={onSubmit}
    >Say Hello!</Anchor>
  <Anchor class="text-center" on:click={skip}>
    Skip and see your feed <i class="fa fa-arrow-right" />
  </Anchor>
</Content>
