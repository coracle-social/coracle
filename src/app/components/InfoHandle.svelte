<script lang="ts">
  import Button from "@lib/components/Button.svelte"
  import Link from "@lib/components/Link.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import {PLATFORM_NAME} from "@app/state"
</script>

<div class="column gap-4">
  <ModalHeader>
    {#snippet title()}
      <div>What is a nostr address?</div>
    {/snippet}
  </ModalHeader>
  <p>
    {PLATFORM_NAME} hosts spaces on the <Link external href="https://nostr.com/" class="underline"
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
  <Button class="btn btn-primary" onclick={() => history.back()}>Got it</Button>
</div>
