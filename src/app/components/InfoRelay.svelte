<script lang="ts">
  import {displayRelayUrl} from "@welshman/util"
  import Button from "@lib/components/Button.svelte"
  import Link from "@lib/components/Link.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import {clip} from "@app/toast"
</script>

<div class="column gap-4">
  <div class="py-2">
    <h1 class="heading">What is a relay?</h1>
  </div>
  <p>
    Flotilla hosts spaces on the <Link external href="https://nostr.com/">Nostr protocol</Link>.
    Nostr uses "relays" to host data, which are special-purpose servers that speak nostr's language.
    This means that anyone can host their own data, making the web more decentralized and resilient.
  </p>
  <p>
    Different relays have different policies for access control and content retention. Be sure to
    double check that you have access to the relays you try to use by visiting their website.
  </p>
  <Button class="btn btn-primary" on:click={() => history.back()}>Got it</Button>
</div>
