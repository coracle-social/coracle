<script lang="ts">
  import {page} from "$app/stores"
  import {displayRelayUrl} from "@welshman/util"
  import {deriveRelay} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import PageContent from "@lib/components/PageContent.svelte"
  import MenuSpaceButton from "@app/components/MenuSpaceButton.svelte"
  import ProfileLatest from "@app/components/ProfileLatest.svelte"
  import SpaceJoin from "@app/components/SpaceJoin.svelte"
  import RelayName from "@app/components/RelayName.svelte"
  import RelayDescription from "@app/components/RelayDescription.svelte"
  import SpaceQuickLinks from "@app/components/SpaceQuickLinks.svelte"
  import SpaceRecentActivity from "@app/components/SpaceRecentActivity.svelte"
  import SpaceRelayStatus from "@app/components/SpaceRelayStatus.svelte"
  import {decodeRelay, userRoomsByUrl} from "@app/state"
  import {makeChatPath} from "@app/routes"
  import {pushModal} from "@app/modal"

  const url = decodeRelay($page.params.relay)
  const relay = deriveRelay(url)
  const joinSpace = () => pushModal(SpaceJoin, {url})

  const owner = $derived($relay?.profile?.pubkey)
</script>

<PageBar>
  {#snippet icon()}
    <div class="center">
      <Icon icon="home-smile" />
    </div>
  {/snippet}
  {#snippet title()}
    <strong>Home</strong>
  {/snippet}
  {#snippet action()}
    <div class="row-2">
      {#if !$userRoomsByUrl.has(url)}
        <Button class="btn btn-primary btn-sm" onclick={joinSpace}>
          <Icon icon="login-2" />
          Join Space
        </Button>
      {:else if owner}
        <Link class="btn btn-primary btn-sm" href={makeChatPath([owner])}>
          <Icon icon="letter" />
          Contact Owner
        </Link>
      {/if}
      <MenuSpaceButton {url} />
    </div>
  {/snippet}
</PageBar>

<PageContent class="flex flex-col gap-2 p-2 pt-4">
  <div class="card2 bg-alt flex flex-col gap-4 text-left">
    <div class="relative flex gap-4">
      <div class="relative">
        <div class="avatar relative">
          <div
            class="center !flex h-16 w-16 min-w-16 rounded-full border-2 border-solid border-base-300 bg-base-300">
            {#if $relay?.profile?.icon}
              <img alt="" src={$relay.profile.icon} />
            {:else}
              <Icon icon="ghost" size={6} />
            {/if}
          </div>
        </div>
      </div>
      <div class="flex min-w-0 flex-col gap-1">
        <h1 class="ellipsize whitespace-nowrap text-2xl font-bold">
          <RelayName {url} />
        </h1>
        <p class="ellipsize text-sm opacity-75">{displayRelayUrl(url)}</p>
      </div>
    </div>
    <RelayDescription {url} />
  </div>
  <SpaceQuickLinks {url} />
  <div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
    <div class="flex flex-col gap-2">
      <SpaceRecentActivity {url} />
    </div>
    <div class="flex flex-col gap-2">
      <SpaceRelayStatus {url} />
      {#if owner}
        <div class="card2 bg-alt">
          <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Icon icon="user-rounded" />
            Latest Updates
          </h3>
          <ProfileLatest {url} pubkey={owner}>
            {#snippet fallback()}
              <p class="text-sm opacity-60">No recent posts from the relay admin</p>
            {/snippet}
          </ProfileLatest>
        </div>
      {/if}
    </div>
  </div>
</PageContent>
