<script lang="ts">
  import Button from "@lib/components/Button.svelte"
  import Link from "@lib/components/Link.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import {PLATFORM_NAME} from "@app/state"
</script>

<div class="column gap-4">
  <ModalHeader>
    {#snippet title()}
      <div>What is a relay?</div>
    {/snippet}
  </ModalHeader>
  <p>
    {PLATFORM_NAME} hosts spaces on the <Link external href="https://nostr.com/" class="underline"
      >Nostr protocol</Link
    >. Nostr uses "relays" to host data, which are special-purpose servers that speak nostr's
    language. This means that anyone can host their own data, making the web more decentralized and
    resilient.
  </p>
  <p>
    Different relays have different policies for access control and content retention. Be sure to
    double check that you have access to the relays you try to use by visiting their website.
  </p>
  <Button class="btn btn-primary" onclick={() => history.back()}>Got it</Button>
</div>
