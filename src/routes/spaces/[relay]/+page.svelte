<script lang="ts">
  import {page} from "$app/stores"
  import {displayRelayUrl} from "@welshman/util"
  import {deriveRelay} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import PageContent from "@lib/components/PageContent.svelte"
  import SocketStatusIndicator from "@lib/components/SocketStatusIndicator.svelte"
  import ProfileLink from "@app/components/ProfileLink.svelte"
  import MenuSpaceButton from "@app/components/MenuSpaceButton.svelte"
  import ProfileLatest from "@app/components/ProfileLatest.svelte"
  import ChannelName from "@app/components/ChannelName.svelte"
  import SpaceJoin from "@app/components/SpaceJoin.svelte"
  import RelayName from "@app/components/RelayName.svelte"
  import RelayDescription from "@app/components/RelayDescription.svelte"
  import SpaceQuickLinks from "@app/components/SpaceQuickLinks.svelte"
  import {
    decodeRelay,
    makeChannelId,
    channelsById,
    deriveUserRooms,
    userRoomsByUrl,
  } from "@app/state"
  import {makeChatPath} from "@app/routes"
  import {pushModal} from "@app/modal"

  const url = decodeRelay($page.params.relay)
  const relay = deriveRelay(url)
  const userRooms = deriveUserRooms(url)
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
      <div class="card2 bg-alt">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Icon icon="chat-round" />
          Recent Activity
        </h3>
        <div class="flex flex-col gap-3">
          {#if $userRooms.length > 0}
            {#each $userRooms.slice(0, 3) as room (room)}
              {@const channel = $channelsById.get(makeChannelId(url, room))}
              <div class="flex items-center gap-3 rounded bg-base-100">
                <div class="flex items-center gap-2">
                  {#if channel?.closed || channel?.private}
                    <Icon icon="lock" size={4} />
                  {:else}
                    <Icon icon="hashtag" />
                  {/if}
                  <span class="font-medium">
                    <ChannelName {url} {room} />
                  </span>
                </div>
                <span class="ml-auto text-sm opacity-60">Active conversations</span>
              </div>
            {/each}
          {:else}
            <p class="text-sm opacity-60">No recent activity</p>
          {/if}
        </div>
      </div>
    </div>
    <div class="flex flex-col gap-2">
      <div class="card2 bg-alt">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Icon icon="server" />
          Relay Status
        </h3>
        <div class="flex flex-col gap-3">
          <SocketStatusIndicator {url} />
          {#if $relay?.profile}
            {@const {software, version, supported_nips, limitation} = $relay.profile}
            <div class="flex flex-wrap gap-1">
              {#if owner}
                <div class="badge badge-neutral">
                  <span class="ellipsize"
                    >Administrator: <ProfileLink unstyled pubkey={owner} /></span>
                </div>
              {/if}
              {#if $relay?.profile?.contact}
                <div class="badge badge-neutral">
                  <span class="ellipsize">Contact: {$relay.profile.contact}</span>
                </div>
              {/if}
              {#if software}
                <div class="badge badge-neutral">
                  <span class="ellipsize">Software: {software}</span>
                </div>
              {/if}
              {#if version}
                <div class="badge badge-neutral">
                  <span class="ellipsize">Version: {version}</span>
                </div>
              {/if}
              {#if Array.isArray(supported_nips)}
                <p class="badge badge-neutral">
                  <span class="ellipsize">Supported NIPs: {supported_nips.join(", ")}</span>
                </p>
              {/if}
              {#if limitation?.auth_required}
                <p class="badge badge-warning">
                  <span class="ellipsize">Auth Required</span>
                </p>
              {/if}
              {#if limitation?.payment_required}
                <p class="badge badge-warning">
                  <span class="ellipsize">Payment Required</span>
                </p>
              {/if}
              {#if limitation?.min_pow_difficulty}
                <p class="badge badge-warning">
                  <span class="ellipsize">Min PoW: {limitation?.min_pow_difficulty}</span>
                </p>
              {/if}
            </div>
          {/if}
        </div>
      </div>
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
