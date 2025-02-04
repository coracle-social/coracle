<script lang="ts">
  import {session} from "@welshman/app"
  import Link from "@lib/components/Link.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import ProfileEject from "@app/components/ProfileEject.svelte"
  import {PLATFORM_NAME} from "@app/state"
  import {pushModal} from "@app/modal"

  const back = () => history.back()

  const startEject = () => pushModal(ProfileEject)
</script>

<div class="column gap-4">
  <ModalHeader>
    {#snippet title()}
      <div>What is a private key?</div>
    {/snippet}
  </ModalHeader>
  <p>
    Most online services keep track of users by giving them a username and password. This gives the
    service <strong>total control</strong> over their users, allowing them to ban them at any time, or
    sell their activity.
  </p>
  <p>
    On <Link external href="https://nostr.com/">Nostr</Link>, <strong>you</strong> control your own
    identity and social data, through the magic of crytography. The basic idea is that you have a
    <strong>public key</strong>, which acts as your user id, and a
    <strong>private key</strong> which allows you to prove your identity.
  </p>
  {#if $session?.email}
    <p>
      It's very important to keep private keys safe, but this can sometimes be tricky, which is why {PLATFORM_NAME}
      supports a traditional account-based login for new users.
    </p>
    <p>If you'd like to switch to self-custody, please click below to get started.</p>
    <ModalFooter>
      <Button class="btn btn-link" onclick={back}>
        <Icon icon="alt-arrow-left" />
        Go back
      </Button>
      <Button class="btn btn-primary" onclick={startEject}>
        <Icon icon="check-circle" />
        I want to hold my own keys
      </Button>
    </ModalFooter>
  {:else}
    <Button class="btn btn-primary" onclick={back}>Got it</Button>
  {/if}
</div>
