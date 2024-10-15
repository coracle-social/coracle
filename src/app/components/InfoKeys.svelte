<script lang="ts">
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
</script>

<div class="column gap-4">
  <ModalHeader>
    <div slot="title">What is a private key?</div>
  </ModalHeader>
  <p>
    Most software keeps track of users by giving them a username and password. This gives the
    service
    <strong>total control</strong> over their users, allowing them to ban them at any time, or sell their
    activity.
  </p>
  <p>
    On <Link external href="https://nostr.com/">Nostr</Link>, <strong>you</strong> control your own
    identity and social data, through the magic of crytography. The basic idea is that you have a
    <strong>public key</strong>, which acts as your user id, and a <strong>private key</strong> which
    allows you to authenticate any message you send.
  </p>
  <p>
    It's very important to keep private keys safe, but this can sometimes be confusing for
    newcomers. This is why flotilla supports <strong>remote signer</strong> login. These services can
    store your keys securely for you, giving you access using a username and password.
  </p>
  <Button class="btn btn-primary" on:click={() => history.back()}>Got it</Button>
</div>
