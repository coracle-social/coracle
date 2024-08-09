<script lang="ts">
  import Link from '@lib/components/Link.svelte'
  import Icon from '@lib/components/Icon.svelte'
  import {clip} from '@app/toast'
</script>

<div class="column gap-4">
  <h1 class="heading">What is a relay?</h1>
  <p>
    Flotilla hosts spaces on the <Link external href="https://nostr.com/">Nostr protocol</Link>.
    Nostr uses "relays" to host data, which are special-purpose servers that speak nostr's language.
    This means that anyone can host their own data, making the web more decentralized and resilient.
  </p>
  <p>
    Only some relays support spaces. You can find a list of suggested relays below,
    or you can <Link external href="https://coracle.tools">host your own</Link>.
    If you do decide to join someone else's, make sure to follow their directions for registering
    as a user.
  </p>
  <div class="card flex-row justify-between">
    devrelay.highlighter.com
    <button on:click={() => clip('devrelay.highlighter.com')}>
      <Icon icon="copy" />
    </button>
  </div>
  <button class="btn btn-primary" on:click={() => history.back()}>
    Got it
  </button>
</div>
