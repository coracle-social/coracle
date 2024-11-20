<script lang="ts">
  import {readable} from "svelte/store"
  import {hash} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {
    thunks,
    deriveProfile,
    deriveProfileDisplay,
    formatTimestampAsTime,
    pubkey,
  } from "@welshman/app"
  import {isMobile} from "@lib/html"
  import LongPress from "@lib/components/LongPress.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import Link from "@lib/components/Link.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Content from "@app/components/Content.svelte"
  import ThunkStatus from "@app/components/ThunkStatus.svelte"
  import ReplySummary from "@app/components/ReplySummary.svelte"
  import ReactionSummary from "@app/components/ReactionSummary.svelte"
  import ChannelConversation from "@app/components/ChannelConversation.svelte"
  import ChannelMessageEmojiButton from "@app/components/ChannelMessageEmojiButton.svelte"
  import ChannelMessageMenuButton from "@app/components/ChannelMessageMenuButton.svelte"
  import ChannelMessageMenuMobile from "@app/components/ChannelMessageMenuMobile.svelte"
  import {colors, tagRoom, deriveEvent, pubkeyLink} from "@app/state"
  import {publishDelete, publishReaction} from "@app/commands"
  import {pushDrawer, pushModal} from "@app/modal"

  export let url, room
  export let event: TrustedEvent
  export let replyTo: any = undefined
  export let showPubkey = false
  export let isHead = false
  export let inert = false

  const thunk = $thunks[event.id]
  const profile = deriveProfile(event.pubkey)
  const profileDisplay = deriveProfileDisplay(event.pubkey)
  const rootTag = event.tags.find(t => t[0].match(/^e$/i))
  const rootId = rootTag?.[1]
  const rootHints = [rootTag?.[2]].filter(Boolean) as string[]
  const rootEvent = rootId ? deriveEvent(rootId, rootHints) : readable(null)
  const [_, colorValue] = colors[parseInt(hash(event.pubkey)) % colors.length]

  const reply = () => replyTo(event)

  const onClick = () => {
    const root = $rootEvent || event

    pushDrawer(ChannelConversation, {url, room, event: root})
  }

  const onLongPress = () => pushModal(ChannelMessageMenuMobile, {url, event})

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

<LongPress
  data-event={event.id}
  on:click={isMobile || inert ? null : onClick}
  onLongPress={inert ? null : onLongPress}
  class="group relative flex w-full flex-col p-2 pb-3 text-left transition-colors {inert
    ? 'hover:bg-base-300'
    : ''}">
  <div class="flex w-full gap-3 overflow-auto">
    {#if showPubkey}
      <Link external href={pubkeyLink(event.pubkey)} class="flex items-start">
        <Avatar src={$profile?.picture} class="border border-solid border-base-content" size={8} />
      </Link>
    {:else}
      <div class="w-8 min-w-8 max-w-8" />
    {/if}
    <div class="-mt-1 min-w-0 flex-grow pr-1">
      {#if showPubkey}
        <div class="flex items-center gap-2">
          <Link
            external
            href={pubkeyLink(event.pubkey)}
            class="text-sm font-bold"
            style="color: {colorValue}">
            {$profileDisplay}
          </Link>
          <span class="text-xs opacity-50">{formatTimestampAsTime(event.created_at)}</span>
        </div>
      {/if}
      <div class="text-sm">
        <Content {event} />
        {#if thunk}
          <ThunkStatus {thunk} class="mt-2" />
        {/if}
      </div>
    </div>
  </div>
  <div class="row-2 ml-10 mt-1">
    {#if !isHead}
      <ReplySummary relays={[url]} {event} on:click={onClick} />
    {/if}
    <ReactionSummary relays={[url]} {event} {onReactionClick} />
  </div>
  <button
    class="join absolute right-1 top-1 border border-solid border-neutral text-xs opacity-0 transition-all"
    class:group-hover:opacity-100={!isMobile}
    on:click|stopPropagation>
    <ChannelMessageEmojiButton {url} {room} {event} />
    {#if replyTo}
      <Button class="btn join-item btn-xs" on:click={reply}>
        <Icon icon="reply" size={4} />
      </Button>
    {/if}
    <ChannelMessageMenuButton {url} {event} />
  </button>
</LongPress>
