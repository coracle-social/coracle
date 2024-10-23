<script lang="ts">
  import {readable} from "svelte/store"
  import {hash, uniqBy, groupBy} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {deriveProfile, deriveProfileDisplay, formatTimestampAsTime, pubkey} from "@welshman/app"
  import type {Thunk} from "@welshman/app"
  import {REACTION} from "@welshman/util"
  import {repository} from "@welshman/app"
  import {slideAndFade, conditionalTransition} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Delay from "@lib/components/Delay.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import Button from "@lib/components/Button.svelte"
  import Content from "@app/components/Content.svelte"
  import ThunkStatus from "@app/components/ThunkStatus.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import ChannelThread from "@app/components/ChannelThread.svelte"
  import ChannelMessageEmojiButton from "@app/components/ChannelMessageEmojiButton.svelte"
  import ChannelMessageMenuButton from "@app/components/ChannelMessageMenuButton.svelte"
  import {REPLY, colors, tagRoom, deriveEvent, displayReaction} from "@app/state"
  import {publishDelete, publishReaction} from "@app/commands"
  import {pushModal, pushDrawer} from "@app/modal"

  export let url
  export let room
  export let event: TrustedEvent
  export let thunk: Thunk
  export let showPubkey = false
  export let isThread = false

  const profile = deriveProfile(event.pubkey)
  const profileDisplay = deriveProfileDisplay(event.pubkey)
  const reactions = deriveEvents(repository, {filters: [{kinds: [REACTION], "#e": [event.id]}]})
  const replies = deriveEvents(repository, {filters: [{kinds: [REPLY], "#E": [event.id]}]})
  const rootTag = event.tags.find(t => t[0].match(/^e$/i))
  const rootId = rootTag?.[1]
  const rootHints = [rootTag?.[2]].filter(Boolean) as string[]
  const rootEvent = rootId ? deriveEvent(rootId, rootHints) : readable(null)
  const [_, colorValue] = colors[parseInt(hash(event.pubkey)) % colors.length]

  const transition = conditionalTransition(thunk, slideAndFade)

  const showProfile = () => pushDrawer(ProfileDetail, {pubkey: event.pubkey})

  const openThread = () => {
    const root = $rootEvent || event

    pushModal(ChannelThread, {url, room, event: root}, {drawer: true})
  }

  const onReactionClick = (content: string, events: TrustedEvent[]) => {
    const reaction = events.find(e => e.pubkey === $pubkey)

    if (reaction) {
      publishDelete({relays: [url], event: reaction})
    } else {
      publishReaction({
        event,
        content,
        relays: [url],
        tags: [tagRoom(room, url)],
      })
    }
  }
</script>

<Delay>
  <button
    in:transition
    on:click={openThread}
    type="button"
    class="group relative flex w-full flex-col gap-1 p-2 text-left transition-colors hover:bg-base-300">
    <div class="flex w-full gap-3">
      {#if showPubkey}
        <Button on:click={showProfile}>
          <Avatar
            src={$profile?.picture}
            class="border border-solid border-base-content"
            size={10} />
        </Button>
      {:else}
        <div class="w-10 min-w-10 max-w-10" />
      {/if}
      <div class="-mt-1 flex-grow pr-1">
        {#if showPubkey}
          <div class="flex items-center gap-2">
            <Button class="text-sm font-bold" style="color: {colorValue}" on:click={showProfile}>
              {$profileDisplay}
            </Button>
            <span class="text-xs opacity-50">{formatTimestampAsTime(event.created_at)}</span>
          </div>
        {/if}
        <div class="text-sm">
          <Content {event} />
          {#if thunk}
            <ThunkStatus {thunk} />
          {/if}
        </div>
      </div>
    </div>
    {#if $reactions.length > 0 || $replies.length > 0}
      <div class="ml-12 flex flex-wrap gap-2 text-xs">
        {#if $replies.length > 0 && !isThread}
          <div class="flex-inline btn btn-neutral btn-xs gap-1 rounded-full">
            <Icon icon="reply" />
            {$replies.length}
          </div>
        {/if}
        {#each groupBy( e => e.content, uniqBy(e => e.pubkey + e.content, $reactions), ).entries() as [content, events]}
          {@const isOwn = events.some(e => e.pubkey === $pubkey)}
          {@const onClick = () => onReactionClick(content, events)}
          <button
            type="button"
            class="flex-inline btn btn-neutral btn-xs gap-1 rounded-full"
            class:border={isOwn}
            class:border-solid={isOwn}
            class:border-primary={isOwn}
            on:click|stopPropagation={onClick}>
            <span>{displayReaction(content)}</span>
            {#if events.length > 1}
              <span>{events.length}</span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
    <button
      class="join absolute right-1 top-1 border border-solid border-neutral text-xs opacity-0 transition-all group-hover:opacity-100"
      on:click|stopPropagation>
      <ChannelMessageEmojiButton {url} {room} {event} />
      <ChannelMessageMenuButton {url} {room} {event} />
    </button>
  </button>
</Delay>
