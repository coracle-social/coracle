<script lang="ts">
  import cx from "classnames"
  import {nip19} from "nostr-tools"
  import {onMount} from "svelte"
  import type {TrustedEvent, SignedEvent} from "@welshman/util"
  import {
    toNostrURI,
    asHashedEvent,
    asSignedEvent,
    isSignedEvent,
    Tags,
    createEvent,
  } from "@welshman/util"
  import {tweened} from "svelte/motion"
  import {identity, filter, sum, uniqBy, prop, pluck} from "ramda"
  import {fly} from "src/util/transition"
  import {formatSats, tryJson} from "src/util/misc"
  import {LOCAL_RELAY_URL} from "src/util/nostr"
  import {quantify, pluralize} from "hurdak"
  import {showInfo} from "src/partials/Toast.svelte"
  import Icon from "src/partials/Icon.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Card from "src/partials/Card.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Modal from "src/partials/Modal.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import HandlerSummary from "src/app/shared/HandlerSummary.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import GroupSummary from "src/app/shared/GroupSummary.svelte"
  import {router} from "src/app/util/router"
  import {
    env,
    mute,
    unmute,
    groups,
    canSign,
    session,
    publish,
    mention,
    handlers,
    tracker,
    hints,
    deriveHandlers,
    deriveIsGroupMember,
    publishToZeroOrMoreGroups,
    publishDeletionForEvent,
    forcePlatformRelays,
    getSetting,
    loadPubkeys,
    isEventMuted,
    getReplyTags,
    getClientTags,
  } from "src/engine"

  export let note: TrustedEvent
  export let replyCtrl
  export let showMuted
  export let addToContext
  export let removeFromContext
  export let replies, likes, zaps
  export let zapper

  const tags = Tags.fromEvent(note)
  const address = tags.context().values().first()
  const nevent = nip19.neventEncode({id: note.id, relays: hints.Event(note).getUrls()})
  const muted = isEventMuted.derived($isEventMuted => $isEventMuted(note, true))
  const kindHandlers = deriveHandlers(note.kind).derived(filter((h: any) => h.recs.length > 1))
  const interpolate = (a, b) => t => a + Math.round((b - a) * t)
  const likesCount = tweened(0, {interpolate})
  const zapsTotal = tweened(0, {interpolate})
  const repliesCount = tweened(0, {interpolate})
  const handler = handlers.key(tags.get("client")?.nth(2))
  const seenOn = tracker.data.derived(m =>
    Array.from(m.get(note.id) || []).filter(url => url !== LOCAL_RELAY_URL),
  )

  //const report = () => router.at("notes").of(note.id, {relays: hints.Event(note).getUrls(3)}).at('report').qp({pubkey: note.pubkey}).open()

  const setView = v => {
    view = v
  }

  const showHandlers = () => {
    handlersShown = true
  }

  const hideHandlers = () => {
    handlersShown = false
  }

  const label = () => router.at("notes").of(note.id).at("label").open()

  const quote = () => router.at("notes/create").cx({quote: note}).open()

  const unmuteNote = () => unmute(note.id)

  const muteNote = () => mute("e", note.id)

  const react = async content => {
    if (isSignedEvent(note)) {
      publish({event: note, relays: forcePlatformRelays(hints.PublishEvent(note).getUrls())})
    }

    const pubs = await publishToZeroOrMoreGroups(
      tags.context().values().valueOf(),
      createEvent(7, {
        content,
        tags: [...getReplyTags(note), ...getClientTags()],
      }),
    )

    for (const pub of pubs) {
      addToContext(pub.request.event)
    }
  }

  const deleteReaction = e => {
    publishDeletionForEvent(e)
    removeFromContext(e)
  }

  const crossPost = async (address = null) => {
    const content = JSON.stringify(note as SignedEvent)
    const tags = [...hints.tagEvent(note).unwrap(), mention(note.pubkey), ...getClientTags()]

    let template
    if (note.kind === 1) {
      template = createEvent(6, {content, tags})
    } else {
      template = createEvent(16, {content, tags: [...tags, ["k", String(note.kind)]]})
    }

    publishToZeroOrMoreGroups([address].filter(identity), template)

    showInfo("Note has been cross-posted!")

    setView(null)
  }

  const startZap = () => {
    const zapTags = tags.whereKey("zap")
    const defaultSplit = hints.tagPubkey(note.pubkey).setKey("zap").append("1").valueOf()
    const splits = zapTags.exists() ? zapTags.unwrap() : [defaultSplit]

    router
      .at("zap")
      .qp({
        splits,
        eid: note.id,
        anonymous: Boolean(note.wrap),
      })
      .cx({callback: addToContext})
      .open()
  }

  const broadcast = () => {
    publish({
      event: asSignedEvent(note as SignedEvent),
      relays: forcePlatformRelays(hints.WriteRelays().getUrls()),
    })

    showInfo("Note has been re-published!")
  }

  const groupOptions = session.derived($session => {
    const options = []

    for (const addr of Object.keys($session?.groups || {})) {
      const group = groups.key(addr).get()
      const isMember = deriveIsGroupMember(addr).get()

      if (group && isMember && addr !== address) {
        options.push(group)
      }
    }

    return uniqBy(prop("address"), options)
  })

  let view
  let actions = []
  let handlersShown = false

  $: disableActions =
    !$canSign ||
    ($muted && !showMuted) ||
    (note.wrap && address && !deriveIsGroupMember(address).get())
  $: like = likes.find(e => e.pubkey === $session?.pubkey)
  $: $likesCount = likes.length
  $: zap = zaps.find(e => e.request.pubkey === $session?.pubkey)
  $: $zapsTotal = sum(pluck("invoiceAmount", zaps)) / 1000
  $: canZap = zapper && note.pubkey !== $session?.pubkey
  $: reply = replies.find(e => e.pubkey === $session?.pubkey)
  $: $repliesCount = replies.length

  $: {
    actions = []

    if ($canSign) {
      actions.push({label: "Quote", icon: "quote-left", onClick: quote})

      if (isSignedEvent(note) && !$env.FORCE_GROUP && ($groupOptions.length > 0 || address)) {
        actions.push({label: "Cross-post", icon: "shuffle", onClick: () => setView("cross-post")})
      }

      actions.push({label: "Tag", icon: "tag", onClick: label})
      //actions.push({label: "Report", icon: "triangle-exclamation", onClick: report})

      if ($muted) {
        actions.push({label: "Unmute", icon: "microphone", onClick: unmuteNote})
      } else {
        actions.push({label: "Mute", icon: "microphone-slash", onClick: muteNote})
      }
    }

    if (!$env.FORCE_GROUP && $env.PLATFORM_RELAYS.length === 0 && isSignedEvent(note)) {
      actions.push({label: "Broadcast", icon: "rss", onClick: broadcast})
    }

    actions.push({
      label: "Details",
      icon: "info",
      onClick: () => setView("info"),
    })
  }

  onMount(() => {
    loadPubkeys(tags.whereKey("zap").values().valueOf())
  })
</script>

<div class="flex justify-between text-neutral-100" on:click|stopPropagation>
  <div class="flex gap-8 text-sm">
    <button
      class={cx("relative flex items-center gap-1 pt-1 transition-all hover:pb-1 hover:pt-0", {
        "pointer-events-none opacity-50": disableActions,
      })}
      on:click={replyCtrl?.start}>
      <Icon icon="message" color={reply ? "accent" : "neutral-100"} />
      {#if $repliesCount > 0}
        <span transition:fly|local={{y: 5, duration: 100}} class="-mt-px">{$repliesCount}</span>
      {/if}
    </button>
    {#if $env.ENABLE_ZAPS}
      <button
        class={cx("relative flex items-center gap-1 pt-1 transition-all hover:pb-1 hover:pt-0", {
          "pointer-events-none opacity-50": disableActions || !canZap,
        })}
        on:click={startZap}>
        <Icon icon="bolt" color={zap ? "accent" : "neutral-100"} />
        {#if $zapsTotal > 0}
          <span transition:fly|local={{y: 5, duration: 100}} class="-mt-px"
            >{formatSats($zapsTotal)}</span>
        {/if}
      </button>
    {/if}
    {#if getSetting("enable_reactions")}
      <button
        class={cx("relative flex items-center gap-1 pt-1 transition-all hover:pb-1 hover:pt-0", {
          "pointer-events-none opacity-50": disableActions || note.pubkey === $session?.pubkey,
        })}
        on:click={() => (like ? deleteReaction(like) : react("+"))}>
        <Icon
          icon="heart"
          color={like ? "accent" : "neutral-100"}
          class={cx("cursor-pointer", {
            "fa-beat fa-beat-custom": like,
          })} />
        {#if $likesCount > 0}
          <span transition:fly|local={{y: 5, duration: 100}} class="-mt-px">{$likesCount}</span>
        {/if}
      </button>
    {/if}
  </div>
  <div class="flex scale-90 items-center gap-2">
    {#if $seenOn}
      <div
        class="staatliches hidden cursor-pointer rounded bg-neutral-800 px-2 text-neutral-100 transition-colors hover:bg-neutral-700 dark:bg-neutral-600 dark:hover:bg-neutral-500 sm:block"
        on:click={() => setView("info")}>
        <span class="text-accent">{$seenOn.length}</span>
        {pluralize($seenOn.length, "relay")}
      </div>
    {/if}
    <OverflowMenu {actions} />
  </div>
</div>

{#if view}
  <Modal onEscape={() => setView(null)}>
    {#if view === "info"}
      {#if zaps.length > 0}
        <h1 class="staatliches text-2xl">Zapped By</h1>
        <div class="grid grid-cols-2 gap-2">
          {#each zaps as zap}
            <div class="flex flex-col gap-1">
              <PersonBadge pubkey={zap.request.pubkey} />
              <span class="ml-16 text-sm text-neutral-600"
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
      {#if $seenOn && $env.PLATFORM_RELAYS.length < 2}
        <h1 class="staatliches text-2xl">Relays</h1>
        <p>This note was found on {quantify($seenOn.length, "relay")} below.</p>
        <div class="flex flex-col gap-2">
          {#each $seenOn as url}
            <RelayCard relay={{url}} />
          {/each}
        </div>
      {/if}
      {#if $kindHandlers.length > 0 || $handler}
        <h1 class="staatliches text-2xl">Apps</h1>
        {#if $handler}
          {@const meta = tryJson(() => JSON.parse($handler.event.content))}
          <p>This note was published using {meta?.display_name || meta?.name}.</p>
          <HandlerSummary event={$handler.event} />
        {/if}
        {#if $kindHandlers.length > 0}
          <div class="flex justify-between">
            <p>
              This note can also be viewed using {quantify(
                $kindHandlers.length,
                "other nostr app",
              )}.
            </p>
            {#if handlersShown}
              <Anchor underline on:click={hideHandlers}>Hide apps</Anchor>
            {:else}
              <Anchor underline on:click={showHandlers}>Show apps</Anchor>
            {/if}
          </div>
          {#if handlersShown}
            <div in:fly={{y: 20}}>
              <FlexColumn>
                {#each $kindHandlers as { address, event, recs } (address)}
                  <HandlerSummary {event} {recs} />
                {/each}
              </FlexColumn>
            </div>
          {/if}
        {/if}
      {/if}
      <h1 class="staatliches text-2xl">Details</h1>
      <CopyValue label="Link" value={toNostrURI(nevent)} />
      <CopyValue label="Event ID" encode={nip19.noteEncode} value={note.id} />
      <CopyValue label="Event JSON" value={JSON.stringify(asHashedEvent(note))} />
    {:else if view === "cross-post"}
      <div class="mb-4 flex items-center justify-center">
        <Heading>Cross-post</Heading>
      </div>
      <div>Select where you'd like to post to:</div>
      <div class="flex flex-col gap-2">
        {#if address}
          <Card invertColors interactive on:click={() => crossPost()}>
            <div class="flex gap-4 text-neutral-100">
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
  </Modal>
{/if}
