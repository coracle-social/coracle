<script lang="ts">
  import Anchor from "src/ui/partials/Anchor.svelte"
  import Heading from "src/ui/partials/Heading.svelte"
  import Content from "src/ui/partials/Content.svelte"
  import Spinner from "src/ui/partials/Spinner.svelte"

  export let signup

  let loading = false

  const startSignup = () => {
    loading = true
    signup()
  }
</script>

<Content size="lg" class="text-center">
  <Heading>Welcome to Nostr</Heading>
  <p>
    You’re all set! If have any questions, or need any help, just ask. Your fellow nostriches are
    always happy to lend a hand.
  </p>
  <Anchor {loading} type="button-accent" on:click={startSignup}>Get on Nostr</Anchor>
  {#if loading}
    <Spinner />
  {/if}
</Content>
