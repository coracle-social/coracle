<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import CardButton from "@lib/components/CardButton.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import SpaceCreateExternal from "@app/components/SpaceCreateExternal.svelte"
  import SpaceInviteAccept from "@app/components/SpaceInviteAccept.svelte"
  import {pushModal} from "@app/modal"

  const startCreate = () => pushModal(SpaceCreateExternal)

  const startJoin = () => pushModal(SpaceInviteAccept)
</script>

<div class="column gap-4">
  <ModalHeader>
    <div slot="title">Add a Space</div>
    <div slot="info">
      Spaces are places where communities come together to work, play, and hang out.
    </div>
  </ModalHeader>
  <Link href="/discover">
    <CardButton class="!btn-primary">
      <div slot="icon"><Icon icon="compass" size={7} /></div>
      <div slot="title">Discover spaces</div>
      <div slot="info">Browse spaces on the discover page.</div>
    </CardButton>
  </Link>
  <Button on:click={startJoin}>
    <CardButton>
      <div slot="icon"><Icon icon="login-2" size={7} /></div>
      <div slot="title">Join a space</div>
      <div slot="info">Enter an invite code or url to join an existing space.</div>
    </CardButton>
  </Button>
  <Button on:click={startCreate}>
    <CardButton>
      <div slot="icon"><Icon icon="add-circle" size={7} /></div>
      <div slot="title">Create a space</div>
      <div slot="info">Just a few questions and you'll be on your way.</div>
    </CardButton>
  </Button>
</div>
