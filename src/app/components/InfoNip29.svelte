<script lang="ts">
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
    Only some relays support spaces. You can find a list of suggested relays below, or you can <Link
      external
      href="https://coracle.tools">host your own</Link
    >. If you do decide to join someone else's, make sure to follow their directions for registering
    as a user.
  </p>
  <div class="alert !flex items-center justify-between">
    <div class="flex items-center gap-2">
      <Icon icon="remote-controller-minimalistic" />
      groups.fiatjaf.com
    </div>
    <Button on:click={() => clip("groups.fiatjaf.com")}>
      <Icon icon="copy" />
    </Button>
  </div>
  <Button class="btn btn-primary" on:click={() => history.back()}>Got it</Button>
</div>
