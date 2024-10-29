<script lang="ts">
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import {PLATFORM_NAME} from "@app/state"
</script>

<div class="column gap-4">
  <ModalHeader>
    <div slot="title">What is a bunker link?</div>
  </ModalHeader>
  <p>
    <Link external class="link" href="https://nostr.com/">Nostr</Link> uses "keys" instead of
    passwords to identify users. This allows users to own their social identity instead of
    renting it from a tech company, and can bring it with them from app to app.
  </p>
  <p>
    A good way to manage your keys is to use a remote signing application. These apps can hold
    your keys and log you in remotely to as many applications as you like, without increasing
    the risk of your keys being stolen.
  </p>
  <p>
    One way to log in with a remote signer is using a "bunker link" which is more secure and
    decentralized than other solutions. Check your signer for a link beginning with "bunker://",
    copy it into {PLATFORM_NAME}, and you should be good to go!
  </p>
  <p>
    If you don't have a signer yet, <Link external class="link" href="https://nsec.app/">nsec.app</Link>
    is an easy way to get started.
  </p>
  <Button class="btn btn-primary" on:click={() => history.back()}>Got it</Button>
</div>
