<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import CardButton from "@lib/components/CardButton.svelte"
  import MenuSpacesItem from "@app/components/MenuSpacesItem.svelte"
  import SpaceAdd from "@app/components/SpaceAdd.svelte"
  import {userRoomsByUrl, PLATFORM_RELAY} from "@app/state"
  import {pushModal} from "@app/modal"

  const addSpace = () => pushModal(SpaceAdd)
</script>

<div class="column menu gap-2">
  {#if PLATFORM_RELAY}
    <MenuSpacesItem url={PLATFORM_RELAY} />
    <Divider />
  {:else if $userRoomsByUrl.size > 0}
    {#each $userRoomsByUrl.keys() as url (url)}
      <MenuSpacesItem {url} />
    {/each}
    <Divider />
  {/if}
  {#if !PLATFORM_RELAY}
    <Button onclick={addSpace}>
      <CardButton>
        {#snippet icon()}
          <div><Icon icon="login-2" size={7} /></div>
        {/snippet}
        {#snippet title()}
          <div>Add a space</div>
        {/snippet}
        {#snippet info()}
          <div>Join or create a new space</div>
        {/snippet}
      </CardButton>
    </Button>
  {/if}
</div>
