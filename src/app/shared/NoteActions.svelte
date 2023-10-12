<script lang="ts">
  import cx from "classnames"
  import {nip19} from "nostr-tools"
  import {tweened} from "svelte/motion"
  import {find, pathEq, identity, propEq, sum, pluck, sortBy} from "ramda"
  import {formatSats} from "src/util/misc"
  import {LOCAL_RELAY_URL, asNostrEvent, getIdOrNaddr, toNostrURI} from "src/util/nostr"
  import {quantify} from "hurdak"
  import {toast} from "src/partials/state"
  import Popover from "src/partials/Popover.svelte"
  import ColorDot from "src/partials/ColorDot.svelte"
  import Content from "src/partials/Content.svelte"
  import Modal from "src/partials/Modal.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {router} from "src/app/router"
  import type {Event} from "src/engine"
  import {
    env,
    mute,
    unmute,
    canSign,
    session,
    Publisher,
    publishDeletion,
    people,
    getUserRelayUrls,
    getPublishHints,
    publishReaction,
    processZap,
    displayRelay,
    getEventHints,
    isEventMuted,
  } from "src/engine"

  export let note: Event
  export let reply
  export let showMuted
  export let showEntire
  export let removeFromContext
  export let replies
  export let likes
  export let zaps

  const person = people.key(note.pubkey)
  const nevent = nip19.neventEncode({id: note.id, relays: getEventHints(note)})
  const muted = isEventMuted.derived($isEventMuted => $isEventMuted(note))
  const interpolate = (a, b) => t => a + Math.round((b - a) * t)
  const likesCount = tweened(0, {interpolate})
  const zapsTotal = tweened(0, {interpolate})
  const repliesCount = tweened(0, {interpolate})

  //const report = () => router.at("notes").of(note.id).at('report').qp({pubkey: note.pubkey}).open()

  const label = () => router.at("notes").of(note.id).at("label").open()

  const quote = () => router.at("notes/create").cx({quote: note}).open()

  const unmuteNote = () => unmute(note.id)

  const muteNote = () => mute("e", note.id)

  const react = async content => {
    const pub = await publishReaction(note, content)

    like = pub.event
  }

  const deleteReaction = e => {
    publishDeletion([getIdOrNaddr(e)])

    like = null
    removeFromContext(e)
  }

  const startZap = () =>
    router
      .at("people")
      .of(note.pubkey)
      .at("zap")
      .qp({eid: note.id})
      .cx({relays: getPublishHints(note)})
      .open()

  const broadcast = () => {
    const relays = getUserRelayUrls("write")
    const event = asNostrEvent(note)

    Publisher.publish({event, relays})

    toast.show("info", "Note has been re-published!")
  }

  const setFeedRelay = url =>
    router
      .fromCurrent()
      .cx({relays: [url]})
      .open()

  let like, allLikes, zap
  let showDetails = false
  let actions = []

  $: disableActions = !$canSign || ($muted && !showMuted)
  $: like = like || find(propEq("pubkey", $session?.pubkey), likes)
  $: allLikes = like ? likes.filter(n => n.id !== like?.id).concat(like) : likes
  $: $likesCount = allLikes.length

  $: zap = zap || find(pathEq(["request", "pubkey"], $session?.pubkey), zaps)

  $: $zapsTotal =
    sum(
      pluck(
        // @ts-ignore
        "invoiceAmount",
        zap ? zaps.filter(n => n.id !== zap?.id).concat(processZap(zap, $person?.zapper)) : zaps
      )
    ) / 1000

  $: canZap = $person?.zapper && note.pubkey !== $session?.pubkey
  $: $repliesCount = replies.length

  $: {
    actions = []

    actions.push({label: "Quote", icon: "quote-left", onClick: quote})
    actions.push({label: "Tag", icon: "tag", onClick: label})
    //actions.push({label: "Report", icon: "triangle-exclamation", onClick: report})

    if ($muted) {
      actions.push({label: "Unmute", icon: "microphone", onClick: unmuteNote})
    } else {
      actions.push({label: "Mute", icon: "microphone-slash", onClick: muteNote})
    }

    if ($env.FORCE_RELAYS.length === 0) {
      actions.push({label: "Broadcast", icon: "rss", onClick: broadcast})

      actions.push({
        label: "Details",
        icon: "info",
        onClick: () => {
          showDetails = true
        },
      })
    }
  }
</script>

<div class="flex justify-between text-gray-1" on:click|stopPropagation>
  <div class="flex">
    <button
      class={cx("relative w-16 pt-1 text-left transition-all hover:pb-1 hover:pt-0", {
        "pointer-events-none opacity-50": disableActions,
      })}
      on:click={reply.start}>
      <i class="fa fa-reply cursor-pointer" />
      {$repliesCount}
    </button>
    <button
      class={cx("relative w-16 pt-1 text-left transition-all hover:pb-1 hover:pt-0", {
        "pointer-events-none opacity-50": disableActions || note.pubkey === $session?.pubkey,
        "text-accent": like,
      })}
      on:click={() => (like ? deleteReaction(like) : react("+"))}>
      <i
        class={cx("fa fa-heart cursor-pointer", {
          "fa-beat fa-beat-custom": like,
        })} />
      {$likesCount}
    </button>
    {#if $env.ENABLE_ZAPS}
      <button
        class={cx("relative w-16 pt-1 text-left transition-all hover:pb-1 hover:pt-0 sm:w-20", {
          "pointer-events-none opacity-50": disableActions || !canZap,
          "text-accent": zap,
        })}
        on:click={startZap}>
        <i class="fa fa-bolt cursor-pointer" />
        {formatSats($zapsTotal)}
      </button>
    {/if}
  </div>
  <div class="flex items-center">
    {#if $env.FORCE_RELAYS.length === 0}
      <!-- Mobile version -->
      <div
        style="transform: scale(-1, 1)"
        class="absolute right-0 top-0 m-3 grid grid-cols-3 gap-2 sm:hidden">
        {#each sortBy(identity, note.seen_on) as url, i}
          <div class={`cursor-pointer order-${3 - (i % 3)}`}>
            <ColorDot value={url} on:click={() => setFeedRelay(url)} />
          </div>
        {:else}
          <div class="cursor-pointer order-3">
            <ColorDot value={LOCAL_RELAY_URL} />
          </div>
        {/each}
      </div>
      <!-- Desktop version -->
      <div
        class={cx("hidden transition-opacity sm:flex", {
          "opacity-0 group-hover:opacity-100": !showEntire,
        })}>
        {#each sortBy(identity, note.seen_on) as url, i}
          <Popover triggerType="mouseenter" interactive={false}>
            <div slot="trigger" class="cursor-pointer p-1">
              <ColorDot value={url} on:click={() => setFeedRelay(url)} />
            </div>
            <div slot="tooltip">{displayRelay({url})}</div>
          </Popover>
        {:else}
          <Popover triggerType="mouseenter" interactive={false}>
            <div slot="trigger" class="cursor-pointer p-1">
              <ColorDot value={LOCAL_RELAY_URL} />
            </div>
            <div slot="tooltip">Loaded from cache</div>
          </Popover>
        {/each}
      </div>
    {/if}
    <div class="ml-1 sm:ml-2">
      <OverflowMenu {actions} />
    </div>
  </div>
</div>

{#if showDetails}
  <Modal
    onEscape={() => {
      showDetails = false
    }}>
    <Content>
      {#if zaps.length > 0}
        <h1 class="staatliches text-2xl">Zapped By</h1>
        <div class="grid grid-cols-2 gap-2">
          {#each zaps as zap}
            <div class="flex flex-col gap-1">
              <PersonBadge pubkey={zap.request.pubkey} />
              <span class="ml-16 text-sm text-gray-5"
                >{formatSats(zap.invoiceAmount / 1000)} sats</span>
            </div>
          {/each}
        </div>
      {/if}
      {#if likes.length > 0}
        <h1 class="staatliches text-2xl">Liked By</h1>
        <div class="grid grid-cols-2 gap-2">
          {#each likes as like}
            <PersonBadge pubkey={like.pubkey} />
          {/each}
        </div>
      {/if}
      <h1 class="staatliches text-2xl">Relays</h1>
      <p>This note was found on {quantify(note.seen_on.length, "relay")} below.</p>
      <div class="flex flex-col gap-2">
        {#each note.seen_on as url}
          <RelayCard relay={{url}} />
        {/each}
      </div>
      <h1 class="staatliches text-2xl">Details</h1>
      <CopyValue label="Link" value={toNostrURI(nevent)} />
      <CopyValue label="Event ID" encode={nip19.noteEncode} value={note.id} />
      <CopyValue label="Event JSON" value={JSON.stringify(note)} />
    </Content>
  </Modal>
{/if}
