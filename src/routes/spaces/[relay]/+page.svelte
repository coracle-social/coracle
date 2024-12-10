<script lang="ts">
  import {page} from "$app/stores"
  import {deriveRelay} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import MenuSpaceButton from "@app/components/MenuSpaceButton.svelte"
  import ProfileFeed from "@app/components/ProfileFeed.svelte"
  import ChannelName from "@app/components/ChannelName.svelte"
  import RelayName from "@app/components/RelayName.svelte"
  import RelayDescription from "@app/components/RelayDescription.svelte"
  import {
    decodeRelay,
    channelIsLocked,
    makeChannelId,
    channelsById,
    deriveUserRooms,
    deriveOtherRooms,
  } from "@app/state"
  import {makeChatPath, makeRoomPath, makeSpacePath} from "@app/routes"

  const url = decodeRelay($page.params.relay)
  const relay = deriveRelay(url)
  const userRooms = deriveUserRooms(url)
  const otherRooms = deriveOtherRooms(url)

  $: pubkey = $relay?.profile?.pubkey
</script>

<div class="relative flex flex-col">
  <PageBar>
    <div slot="icon" class="center">
      <Icon icon="home-smile" />
    </div>
    <strong slot="title">Home</strong>
    <div slot="action" class="row-2">
      {#if pubkey}
        <Link class="btn btn-primary btn-sm" href={makeChatPath([pubkey])}>
          <Icon icon="letter" />
          Contact Owner
        </Link>
      {/if}
      <MenuSpaceButton {url} />
    </div>
  </PageBar>
  <div class="col-2 p-2">
    <div class="card2 bg-alt col-4 text-left">
      <div class="relative flex gap-4">
        <div class="relative">
          <div class="avatar relative">
            <div
              class="center !flex h-12 w-12 min-w-12 rounded-full border-2 border-solid border-base-300 bg-base-300">
              {#if $relay?.profile?.icon}
                <img alt="" src={$relay.profile.icon} />
              {:else}
                <Icon icon="ghost" size={5} />
              {/if}
            </div>
          </div>
        </div>
        <div>
          <h2 class="ellipsize whitespace-nowrap text-xl">
            <RelayName {url} />
          </h2>
          <p class="text-sm opacity-75">{url}</p>
        </div>
      </div>
      <RelayDescription {url} />
      {#if $relay?.profile}
        {@const {software, version, supported_nips, limitation} = $relay.profile}
        <div class="flex flex-wrap gap-1">
          {#if limitation?.auth_required}
            <p class="badge badge-neutral">
              <span class="ellipsize">Authentication Required</span>
            </p>
          {/if}
          {#if limitation?.payment_required}
            <p class="badge badge-neutral"><span class="ellipsize">Payment Required</span></p>
          {/if}
          {#if limitation?.min_pow_difficulty}
            <p class="badge badge-neutral">
              <span class="ellipsize">Requires PoW {limitation?.min_pow_difficulty}</span>
            </p>
          {/if}
          {#if supported_nips}
            <p class="badge badge-neutral">
              <span class="ellipsize">NIPs: {supported_nips.join(", ")}</span>
            </p>
          {/if}
          {#if software}
            <p class="badge badge-neutral"><span class="ellipsize">Software: {software}</span></p>
          {/if}
          {#if version}
            <p class="badge badge-neutral"><span class="ellipsize">Version: {version}</span></p>
          {/if}
        </div>
      {/if}
    </div>
    <div class="grid grid-cols-3 gap-2">
      <Link href={makeSpacePath(url, "threads")} class="btn btn-primary justify-start border-none">
        <Icon icon="notes-minimalistic" /> Threads
      </Link>
      {#each $userRooms as room (room)}
        <Link
          href={makeRoomPath(url, room)}
          class="btn btn-neutral flex-nowrap justify-start whitespace-nowrap border-none">
          {#if channelIsLocked($channelsById.get(makeChannelId(url, room)))}
            <Icon icon="lock" size={4} />
          {:else}
            <Icon icon="hashtag" />
          {/if}
          <div class="min-w-0 overflow-hidden text-ellipsis">
            <ChannelName {url} {room} />
          </div>
        </Link>
      {/each}
      {#each $otherRooms as room (room)}
        <Link
          href={makeRoomPath(url, room)}
          class="bg-alt btn btn-neutral flex-nowrap justify-start whitespace-nowrap border-none">
          {#if channelIsLocked($channelsById.get(makeChannelId(url, room)))}
            <Icon icon="lock" size={4} />
          {:else}
            <Icon icon="hashtag" />
          {/if}
          <div class="min-w-0 overflow-hidden text-ellipsis">
            <ChannelName {url} {room} />
          </div>
        </Link>
      {/each}
    </div>
    {#if pubkey}
      <Divider>Recent posts from the relay admin</Divider>
      <ProfileFeed {url} {pubkey} />
    {/if}
  </div>
</div>
