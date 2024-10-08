<script lang="ts">
  import Button from "@lib/components/Button.svelte"
  import Link from "@lib/components/Link.svelte"
</script>

<div class="column gap-4">
  <div class="py-2">
    <h1 class="heading">What is a nostr address?</h1>
  </div>
  <p>
    Flotilla hosts spaces on the <Link external href="https://nostr.com/" class="underline"
      >Nostr protocol</Link
    >. Nostr uses "nostr addresses" to make it easier for people to find you, without having to
    memorize your public key (your user id).
  </p>
  <p>
    There are several providers of nostr addresses, including several clients. You can find a list
    and more information on <Link
      external
      href="https://nostr.how/en/guides/get-verified"
      class="underline">nostr.how</Link
    >.
  </p>
  <Button class="btn btn-primary" on:click={() => history.back()}>Got it</Button>
</div>
