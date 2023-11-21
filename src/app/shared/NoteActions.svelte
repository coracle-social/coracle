<script lang="ts">
  import cx from "classnames"
  import {nip19} from "nostr-tools"
  import {toNostrURI, createEvent} from "paravel"
  import {tweened} from "svelte/motion"
  import {identity, sum, uniqBy, prop, pluck, sortBy} from "ramda"
  import {formatSats} from "src/util/misc"
  import {LOCAL_RELAY_URL, getGroupAddress, getIdOrAddressTag, asNostrEvent} from "src/util/nostr"
  import {quantify} from "hurdak"
  import {toast} from "src/partials/state"
  import Popover from "src/partials/Popover.svelte"
  import Card from "src/partials/Card.svelte"
  import Heading from "src/partials/Heading.svelte"
  import ColorDot from "src/partials/ColorDot.svelte"
  import Content from "src/partials/Content.svelte"
  import Modal from "src/partials/Modal.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import GroupSummary from "src/app/shared/GroupSummary.svelte"
  import {router} from "src/app/router"
  import type {Event} from "src/engine"
  import {
    env,
    mute,
    unmute,
    groups,
    canSign,
    session,
    Publisher,
    mention,
    signer,
    deriveGroupStatus,
    publishToZeroOrMoreGroups,
    publishDeletionForEvent,
    getUserRelayUrls,
    getPublishHints,
    getSetting,
    processZap,
    displayRelay,
    getEventHints,
    isEventMuted,
    getReplyTags,
  } from "src/engine"

  export let note: Event
  export let reply
  export let showMuted
  export let showEntire
  export let removeFromContext
  export let replies, likes, zaps
  export let zapper

  const address = getGroupAddress(note)
  const relays = getEventHints(note)
  const nevent = nip19.neventEncode({id: note.id, relays})
  const muted = isEventMuted.derived($isEventMuted => $isEventMuted(note, true))
  const interpolate = (a, b) => t => a + Math.round((b - a) * t)
  const likesCount = tweened(0, {interpolate})
  const zapsTotal = tweened(0, {interpolate})
  const repliesCount = tweened(0, {interpolate})

  //const report = () => router.at("notes").of(note.id, {relays: getEventHints(note)}).at('report').qp({pubkey: note.pubkey}).open()

  const setView = v => {
    view = v
  }

  const label = () => router.at("notes").of(note.id, {relays}).at("label").open()

  const quote = () => router.at("notes/create").cx({quote: note, relays}).open()

  const unmuteNote = () => unmute(note.id)

  const muteNote = () => mute("e", note.id)

  const react = async content => {
    const relays = getPublishHints(note)
    const template = createEvent(7, {content, tags: getReplyTags(note)})

    if (!note.wrap) {
      Publisher.publish({relays, event: asNostrEvent(note)})
    }

    publishToZeroOrMoreGroups([address].filter(identity), template, {relays})

    like = await signer.get().signAsUser(template)
  }

  const deleteReaction = e => {
    publishDeletionForEvent(e)

    like = null
    removeFromContext(e)
  }

  const crossPost = async (address = null) => {
    const relays = getPublishHints(note)
    const tags = [getIdOrAddressTag(note, relays[0]), mention(note.pubkey)]
    const content = JSON.stringify(asNostrEvent(note))

    let template
    if (note.kind === 1) {
      template = createEvent(6, {content, tags})
    } else {
      template = createEvent(16, {content, tags: [...tags, ["k", note.kind]]})
    }

    publishToZeroOrMoreGroups([address].filter(identity), template, {relays})

    setView(null)
  }

  const startZap = () =>
    router
      .at("people")
      .of(note.pubkey, {relays: getPublishHints(note)})
      .at("zap")
      .qp({eid: note.id, lnurl: zapper.lnurl})
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

  const groupOptions = session.derived($session => {
    const options = []

    for (const addr of Object.keys($session.groups || {})) {
      const group = groups.key(addr).get()
      const {access} = deriveGroupStatus(addr).get()

      if (group && access && addr !== address) {
        options.push(group)
      }
    }

    return uniqBy(prop("address"), options)
  })

  let view
  let actions = []

  $: disableActions =
    !$canSign ||
    ($muted && !showMuted) ||
    (note.wrap && deriveGroupStatus(address).get() !== "granted")
  $: like = like || likes.find(e => e.pubkey === $session?.pubkey)
  $: allLikes = like ? likes.filter(n => n.id !== like?.id).concat(like) : likes
  $: $likesCount = allLikes.length

  $: zap = zap || zaps.find(e => e.request.pubkey === $session?.pubkey, zaps)

  $: {
    const filteredZaps: {invoiceAmount: number}[] = zap
      ? zaps.filter(n => n.id !== zap?.id).concat(processZap(zap, zapper))
      : zaps

    $zapsTotal = sum(pluck("invoiceAmount", filteredZaps)) / 1000
  }

  $: canZap = zapper && note.pubkey !== $session?.pubkey
  $: $repliesCount = replies.length

  $: {
    actions = []

    actions.push({label: "Quote", icon: "quote-left", onClick: quote})
    actions.push({label: "Cross-post", icon: "shuffle", onClick: () => setView("cross-post")})
    actions.push({label: "Tag", icon: "tag", onClick: label})
    //actions.push({label: "Report", icon: "triangle-exclamation", onClick: report})

    if ($muted) {
      actions.push({label: "Unmute", icon: "microphone", onClick: unmuteNote})
    } else {
      actions.push({label: "Mute", icon: "microphone-slash", onClick: muteNote})
    }

    if ($env.FORCE_RELAYS.length === 0) {
      actions.push({label: "Broadcast", icon: "rss", onClick: broadcast})
    }

    actions.push({
      label: "Details",
      icon: "info",
      onClick: () => setView("info"),
    })
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
    {#if getSetting("enable_reactions")}
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
    {/if}
    {#if $env.ENABLE_ZAPS && !note.wrap}
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

{#if view}
  <Modal onEscape={() => setView(null)}>
    <Content>
      {#if view === "info"}
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
        {#if note.seen_on.length > 0}
          <h1 class="staatliches text-2xl">Relays</h1>
          <p>This note was found on {quantify(note.seen_on.length, "relay")} below.</p>
          <div class="flex flex-col gap-2">
            {#each note.seen_on as url}
              <RelayCard relay={{url}} />
            {/each}
          </div>
        {/if}
        <h1 class="staatliches text-2xl">Details</h1>
        <CopyValue label="Link" value={toNostrURI(nevent)} />
        <CopyValue label="Event ID" encode={nip19.noteEncode} value={note.id} />
        <CopyValue label="Event JSON" value={JSON.stringify(asNostrEvent(note))} />
      {:else if view === "cross-post"}
        <div class="mb-4 flex items-center justify-center">
          <Heading>Cross-post</Heading>
        </div>
        <div>Select where you'd like to post to:</div>
        <div class="flex flex-col gap-2">
          {#if address}
            <Card invertColors interactive on:click={() => crossPost()}>
              <div class="flex gap-4 text-gray-1">
                <i class="fa fa-earth-asia fa-2x" />
                <div class="flex min-w-0 flex-grow flex-col gap-4">
                  <p class="text-2xl">Global</p>
                  <p>Post to your main feed.</p>
                </div>
              </div>
            </Card>
          {/if}
          {#each $groupOptions as g (g.address)}
            <Card invertColors interactive on:click={() => crossPost(g.address)}>
              <GroupSummary address={g.address} />
            </Card>
          {/each}
        </div>
      {/if}
    </Content>
  </Modal>
{/if}
