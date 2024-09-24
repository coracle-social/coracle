<script lang="ts">
  import Button from "@lib/components/Button.svelte"
  import CardButton from "@lib/components/CardButton.svelte"
  import SpaceCreateExternal from "@app/components/SpaceCreateExternal.svelte"
  import SpaceInviteAccept from "@app/components/SpaceInviteAccept.svelte"
  import {pushModal} from "@app/modal"

  const startCreate = () => pushModal(SpaceCreateExternal)

  const startJoin = () => pushModal(SpaceInviteAccept)
</script>

<div class="column gap-4">
  <div class="py-2">
    <h1 class="heading">Add a Space</h1>
    <p class="text-center">
      Spaces are places where communities come together to work, play, and hang out.
    </p>
  </div>
  <CardButton icon="add-circle" title="Create a space" on:click={startCreate}>
    Just a few questions and you'll be on your way.
  </CardButton>
  <CardButton icon="login-2" title="Join a space" on:click={startJoin}>
    Enter an invite code or url to join an existing space.
  </CardButton>
</div>
