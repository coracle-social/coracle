<script lang="ts">
  import cx from "classnames"
  import {nip19} from "nostr-tools"
  import {sum, pluck} from "@welshman/lib"
  import {getContext, onMount} from "svelte"
  import {tweened} from "svelte/motion"
  import {derived} from "svelte/store"
  import {ctx, nth, nthEq, remove, last, sortBy, uniqBy, prop, identity} from "@welshman/lib"
  import {
    deriveZapper,
    deriveZapperForPubkey,
    repository,
    signer,
    tagReactionTo,
    tagZapSplit,
    mute,
    pubkey,
    unmute,
    thunks,
  } from "@welshman/app"
  import type {TrustedEvent, SignedEvent} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {
    LOCAL_RELAY_URL,
    toNostrURI,
    asSignedEvent,
    isSignedEvent,
    createEvent,
    getPubkeyTagValues,
    getLnUrl,
    zapFromEvent,
    NOTE,
    REACTION,
    ZAP_RESPONSE,
    getReplyFilters,
    isChildOf,
  } from "@welshman/util"
  import {fly} from "src/util/transition"
  import {formatSats, timestamp1} from "src/util/misc"
  import {quantify, pluralize} from "hurdak"
  import {browser} from "src/partials/state"
  import {showInfo} from "src/partials/Toast.svelte"
  import Icon from "src/partials/Icon.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import WotScore from "src/partials/WotScore.svelte"
  import Popover from "src/partials/Popover.svelte"
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import Menu from "src/partials/Menu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Modal from "src/partials/Modal.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import HandlerCard from "src/app/shared/HandlerCard.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import NotePending from "src/app/shared/NotePending.svelte"
  import {router} from "src/app/util/router"
  import {
    env,
    publish,
    deriveHandlersForKind,
    signAndPublish,
    deleteEvent,
    getSetting,
    loadPubkeys,
    getClientTags,
    trackerStore,
    sessionWithMeta,
    userMutes,
    sortEventsDesc,
    load,
  } from "src/engine"
  import {getHandlerKey, readHandlers, displayHandler} from "src/domain"
  import {openReplies} from "src/app/state"
  import {isLike} from "src/util/nostr"

  export let event: TrustedEvent
  export let showHidden = false

  const signedEvent = asSignedEvent(event as any)
  const nevent = nip19.neventEncode({
    id: event.id,
    kind: event.kind,
    author: event.pubkey,
    relays: ctx.app.router.Event(event).getUrls(),
  })

  const interpolate = (a, b) => t => a + Math.round((b - a) * t)
  const mentions = getPubkeyTagValues(event.tags)
  const likesCount = tweened(0, {interpolate})
  const zapsTotal = tweened(0, {interpolate})
  const repliesCount = tweened(0, {interpolate})
  const kindHandlers = deriveHandlersForKind(event.kind)
  const handlerId = String(event.tags.find(nthEq(0, "client"))?.[2] || "")
  const handlerEvent = handlerId ? repository.getEvent(handlerId) : null
  const noteActions = getSetting("note_actions")
  const seenOn = derived(trackerStore, $t =>
    remove(LOCAL_RELAY_URL, Array.from($t.getRelays(event.id))),
  )
  const topLevel = getContext("topLevel")

  const setView = v => {
    view = v
  }

  const showHandlers = () => {
    handlersShown = true
  }

  const hideHandlers = () => {
    handlersShown = false
  }

  const os = browser.os?.name?.toLowerCase()

  const createLabel = () => router.at("notes").of(event.id).at("label").open()

  const quote = () => router.at("notes/create").cx({quote: event}).open()

  const report = () => router.at("notes").of(event.id).at("report").open()

  const deleteNote = () =>
    router.at("notes").of(event.id).at("delete").qp({kind: event.kind}).open()

  const react = async content => {
    const tags = [...tagReactionTo(event), ...getClientTags()]
    const template = createEvent(7, {content, tags})
    await signAndPublish(template)
  }

  const deleteReaction = e => {
    deleteEvent(e)
  }

  const startZap = () => {
    const zapTags = event.tags.filter(nthEq(0, "zap"))
    const defaultSplit = tagZapSplit(event.pubkey)
    const splits = zapTags.length > 0 ? zapTags : [defaultSplit]

    router
      .at("zap")
      .qp({
        splits,
        id: event.id,
        anonymous: Boolean(event.wrap),
      })
      .open()
  }

  const broadcast = () => {
    publish({
      event: asSignedEvent(event as SignedEvent),
      relays: ctx.app.router.FromUser().getUrls(),
    })

    showInfo("Note has been re-published!")
  }

  const openWithHandler = handler => {
    const [templateTag] = sortBy((t: string[]) => {
      if (t[0] === "web" && last(t) === "nevent") return -6
      if (t[0] === "web" && last(t) === "note") return -5
      if ((t[0] === "web" && t.length === 2) || last(t) === "") return -4
      if (t[0] === os && last(t) === "nevent") return -3
      if (t[0] === os && last(t) === "note") return -2
      if ((t[0] === os && t.length === 2) || last(t) === "") return -1

      return 0
    }, handler.event.tags)

    const entity = last(templateTag) === "note" ? nip19.noteEncode(event.id) : nevent

    window.open(templateTag[1].replace("<bech32>", entity))
  }

  const context = deriveEvents(repository, {filters: getReplyFilters([event])})

  $: children = $context.filter(e => isChildOf(e, event))

  let view
  let actions = []
  let handlersShown = false

  $: lnurl = getLnUrl(event.tags?.find(nthEq(0, "zap"))?.[1] || "")
  $: zapper = lnurl ? deriveZapper(lnurl) : deriveZapperForPubkey(event.pubkey)
  $: muted = $userMutes.has(event.id)
  // Split out likes, uniqify by pubkey since a like can be duplicated across groups
  $: likes = uniqBy(prop("pubkey"), children.filter(isLike))

  // Split out zaps
  $: zaps = children
    .filter(e => e.kind === 9735)
    .map(e => ($zapper ? zapFromEvent(e, $zapper) : null))
    .filter(identity)
  $: replies = sortEventsDesc(children.filter(e => e.kind === NOTE))

  $: disableActions = !$signer || (muted && !showHidden)
  $: liked = likes.find(e => e.pubkey === $sessionWithMeta?.pubkey)
  $: $likesCount = likes.length
  $: zapped = zaps.find(e => e.request.pubkey === $sessionWithMeta?.pubkey)
  $: $zapsTotal = sum(pluck("invoiceAmount", zaps)) / 1000
  $: canZap = $zapper?.allowsNostr && event.pubkey !== $sessionWithMeta?.pubkey
  $: replied = replies.find(e => e.pubkey === $sessionWithMeta?.pubkey)
  $: $repliesCount = replies.length
  $: handlers =
    event.kind !== 1 &&
    $kindHandlers.filter(
      h =>
        h.name.toLowerCase() !== "coracle" &&
        h.event.tags.some(
          t =>
            ["web", os].includes(t[0]) &&
            (t.length === 2 || ["note", "nevent", ""].includes(last(t))),
        ),
    )

  $: {
    actions = []

    if ($signer) {
      actions.push({label: "Quote", icon: "quote-left", onClick: quote})

      actions.push({label: "Tag", icon: "tag", onClick: createLabel})

      if (muted) {
        actions.push({label: "Unmute", icon: "microphone", onClick: () => unmute(event.id)})
      } else {
        actions.push({
          label: "Mute",
          icon: "microphone-slash",
          onClick: () => mute(["e", event.id]),
        })
      }

      actions.push({label: "Report", icon: "triangle-exclamation", onClick: report})
    }

    if (env.PLATFORM_RELAYS.length === 0 && isSignedEvent(event)) {
      actions.push({label: "Broadcast", icon: "rss", onClick: broadcast})
    }

    if (event.pubkey === $sessionWithMeta?.pubkey) {
      actions.push({
        label: "Delete",
        icon: "trash",
        onClick: deleteNote,
      })
    }

    actions.push({
      label: "Details",
      icon: "info",
      onClick: () => setView("info"),
    })
  }

  onMount(() => {
    loadPubkeys(event.tags.filter(nthEq(0, "zap")).map(nth(1)))

    const actions = getSetting("note_actions")
    const kinds = []

    if (actions.includes("replies")) {
      kinds.push(NOTE)
    }

    if (actions.includes("reactions")) {
      kinds.push(REACTION)
    }

    if (env.ENABLE_ZAPS && actions.includes("zaps")) {
      kinds.push(ZAP_RESPONSE)
    }

    load({
      relays: ctx.app.router.Replies(event).getUrls(),
      filters: getReplyFilters([event], {kinds}),
    })
  })
</script>

{#if event.created_at > $timestamp1 - 45 && event.pubkey === $pubkey && !topLevel && $thunks[event.id]}
  <NotePending {event} />
{:else}
  <button
    tabindex="-1"
    type="button"
    class="flex w-full justify-between text-neutral-100"
    on:click|stopPropagation>
    <div class="flex gap-8 text-sm">
      <button
        class={cx("relative flex items-center gap-1 pt-1 transition-all hover:pb-1 hover:pt-0", {
          "pointer-events-none opacity-50": disableActions,
        })}
        on:click={_ => {
          $openReplies[event.id] = true
        }}>
        <Icon icon="message" color={replied ? "accent" : "neutral-100"} />
        {#if $repliesCount > 0 && noteActions.includes("replies")}
          <span transition:fly|local={{y: 5, duration: 100}} class="-mt-px">{$repliesCount}</span>
        {/if}
      </button>
      {#if env.ENABLE_ZAPS && noteActions.includes("zaps")}
        <button
          class={cx("relative flex items-center gap-1 pt-1 transition-all hover:pb-1 hover:pt-0", {
            "pointer-events-none opacity-50": disableActions || !canZap,
          })}
          on:click={startZap}>
          <Icon icon="bolt" color={zapped ? "accent" : "neutral-100"} />
          {#if $zapsTotal > 0}
            <span transition:fly|local={{y: 5, duration: 100}} class="-mt-px"
              >{formatSats($zapsTotal)}</span>
          {/if}
        </button>
      {/if}
      {#if noteActions.includes("reactions")}
        <button
          class={cx("relative flex items-center gap-1 pt-1 transition-all hover:pb-1 hover:pt-0", {
            "pointer-events-none opacity-50":
              disableActions || event.pubkey === $sessionWithMeta?.pubkey,
          })}
          on:click={() => (liked ? deleteReaction(liked) : react("+"))}>
          <Icon
            icon="heart"
            color={liked ? "accent" : "neutral-100"}
            class={cx("cursor-pointer", {
              "fa-beat fa-beat-custom": liked,
            })} />
          {#if $likesCount > 0}
            <span transition:fly|local={{y: 5, duration: 100}} class="-mt-px">{$likesCount}</span>
          {/if}
        </button>
      {/if}
      {#if handlers.length > 0 && noteActions.includes("recommended_apps")}
        <Popover theme="transparent" opts={{hideOnClick: true}}>
          <button
            slot="trigger"
            class="relative flex items-center gap-1 pt-1 transition-all hover:pb-1 hover:pt-0 sm:block">
            <Icon icon="openwith" color="neutral-100" class="cursor-pointer" />
          </button>
          <div slot="tooltip" class="max-h-[300px] min-w-[180px] overflow-auto">
            <Menu>
              <MenuItem inert class="bg-neutral-900">Open with:</MenuItem>
              {#each handlers as handler}
                <MenuItem
                  class="flex h-12 items-center justify-between gap-2"
                  on:click={() => openWithHandler(handler)}>
                  <div class="flex gap-2">
                    <ImageCircle class="h-5 w-5" src={handler.image} />
                    {handler.name}
                  </div>
                  {#if handler.recommendations.length > 0}
                    <WotScore accent score={handler.recommendations.length} />
                  {/if}
                </MenuItem>
              {/each}
            </Menu>
          </div>
        </Popover>
      {/if}
    </div>
    <div class="flex scale-90 items-center gap-2">
      {#if event.wrap}
        <div
          class="staatliches flex h-6 items-center gap-1 rounded bg-neutral-800 px-2 text-neutral-100 transition-colors dark:bg-neutral-600 dark:hover:bg-neutral-500">
          <i class="fa fa-lock text-xs sm:text-accent" />
          <span class="hidden sm:inline">Encrypted</span>
        </div>
      {/if}
      {#if $seenOn?.length > 0 && (env.PLATFORM_RELAYS.length === 0 || env.PLATFORM_RELAYS.length > 1)}
        <div
          class="staatliches hidden cursor-pointer rounded bg-neutral-800 px-2 text-neutral-100 transition-colors hover:bg-neutral-700 dark:bg-neutral-600 dark:hover:bg-neutral-500 sm:block"
          on:click={() => setView("info")}>
          <span class="text-accent">{$seenOn.length}</span>
          {pluralize($seenOn.length, "relay")}
        </div>
      {/if}
      <OverflowMenu {actions} />
    </div>
  </button>

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
        {#if $seenOn?.length > 0 && (env.PLATFORM_RELAYS.length === 0 || env.PLATFORM_RELAYS.length > 1)}
          <h1 class="staatliches text-2xl">Relays</h1>
          <p>This note was found on {quantify($seenOn.length, "relay")} below.</p>
          <div class="flex flex-col gap-2">
            {#each $seenOn as url}
              <RelayCard {url} />
            {/each}
          </div>
        {/if}
        {#if mentions.length > 0}
          <h1 class="staatliches text-2xl">In this conversation</h1>
          <p>{quantify(mentions.length, "person is", "people are")} tagged in this note.</p>
          <div class="grid grid-cols-2 gap-2">
            {#each mentions as pubkey}
              <PersonBadge {pubkey} />
            {/each}
          </div>
        {/if}
        {#if handlers.length > 0 || handlerEvent}
          <h1 class="staatliches text-2xl">Apps</h1>
          {#if handlerEvent}
            {@const [handler] = readHandlers(handlerEvent)}
            {#if handler}
              <p>This note was published using {displayHandler(handler)}.</p>
              <HandlerCard {handler} />
            {/if}
          {/if}
          {#if handlers.length > 0}
            <div class="flex justify-between">
              <p>
                This note can also be viewed using {quantify(handlers.length, "other nostr app")}.
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
                  {#each handlers as handler (getHandlerKey(handler))}
                    <HandlerCard {handler} />
                  {/each}
                </FlexColumn>
              </div>
            {/if}
          {/if}
        {/if}
        <h1 class="staatliches text-2xl">Details</h1>
        <CopyValue label="Link" value={toNostrURI(nevent)} />
        <CopyValue label="Event ID" encode={nip19.noteEncode} value={event.id} />
        <CopyValue label="Event JSON" value={JSON.stringify(signedEvent)} />
      {/if}
    </Modal>
  {/if}
{/if}
