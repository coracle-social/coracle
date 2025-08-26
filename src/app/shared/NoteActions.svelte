<script lang="ts">
  import cx from "classnames"
  import * as nip19 from "nostr-tools/nip19"
  import {tweened} from "svelte/motion"
  import {derived} from "svelte/store"
  import {sum, pluck, spec, nthEq, remove, last, sortBy, uniqBy, prop} from "@welshman/lib"
  import {LOCAL_RELAY_URL} from "@welshman/relay"
  import {Router, addMaximalFallbacks} from "@welshman/router"
  import {
    deriveZapper,
    deriveZapperForPubkey,
    repository,
    signer,
    tagEventForReaction,
    tagZapSplit,
    mutePrivately,
    pubkey,
    unmute,
    pin,
    unpin,
  } from "@welshman/app"
  import type {TrustedEvent, SignedEvent} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {
    asSignedEvent,
    isSignedEvent,
    makeEvent,
    getLnUrl,
    ZAP_RESPONSE,
    REACTION,
    getReplyFilters,
    isChildOf,
    getAddress,
  } from "@welshman/util"
  import {publishThunk} from "@welshman/app"
  import {getPow} from "src/util/pow"
  import {fly} from "src/util/transition"
  import {replyKinds} from "src/util/nostr"
  import {formatSats, pluralize} from "src/util/misc"
  import {browser} from "src/partials/state"
  import {showInfo} from "src/partials/Toast.svelte"
  import Icon from "src/partials/Icon.svelte"
  import WotScore from "src/partials/WotScore.svelte"
  import Popover from "src/partials/Popover.svelte"
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import Menu from "src/partials/Menu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import Modal from "src/partials/Modal.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import NoteInfo from "src/app/shared/NoteInfo.svelte"
  import {router, deriveValidZaps, zap} from "src/app/util"
  import {
    env,
    deriveHandlersForKind,
    signAndPublish,
    deleteEvent,
    getSetting,
    getClientTags,
    trackerStore,
    userMutedEvents,
    sortEventsDesc,
    userPins,
  } from "src/engine"

  export let event: TrustedEvent
  export let onReplyStart: () => void
  export let showHidden = false

  const nevent = nip19.neventEncode({
    id: event.id,
    kind: event.kind,
    author: event.pubkey,
    relays: Router.get().Event(event).limit(3).getUrls(),
  })

  const pow = getPow(event)
  const interpolate = (a, b) => t => a + Math.round((b - a) * t)
  const likesCount = tweened(0, {interpolate})
  const zapsTotal = tweened(0, {interpolate})
  const repliesCount = tweened(0, {interpolate})
  const kindHandlers = deriveHandlersForKind(event.kind)
  const noteActions = getSetting("note_actions")
  const seenOn = derived(trackerStore, $t =>
    remove(LOCAL_RELAY_URL, Array.from($t.getRelays(event.id))),
  )
  const setView = v => {
    view = v
  }

  const os = browser.os?.name?.toLowerCase()

  const createLabel = () => router.at("notes").of(event.id).at("label").open()

  const quote = () => router.at("notes/create").cx({quote: event}).open()

  const report = () => router.at("notes").of(event.id).at("report").open()

  const deleteNote = () =>
    router.at("notes").of(event.id).at("delete").qp({kind: event.kind}).open()

  const react = async content => {
    const tags = [...tagEventForReaction(event), ...getClientTags()]
    const template = makeEvent(7, {content, tags})
    await signAndPublish(template)
  }

  const deleteReaction = e => {
    deleteEvent(e)
  }

  const startZap = () => {
    const zapTags = event.tags.filter(nthEq(0, "zap"))
    const defaultSplit = tagZapSplit(event.pubkey)
    const splits = zapTags.length > 0 ? zapTags : [defaultSplit]

    zap({
      splits,
      eventId: event.id,
      anonymous: Boolean(event.wrap),
    })
  }

  const broadcast = () => {
    publishThunk({
      event: asSignedEvent(event as SignedEvent),
      relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
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

  let view
  let actions = []

  $: lnurl = getLnUrl(event.tags?.find(nthEq(0, "zap"))?.[1] || "")
  $: zapper = lnurl ? deriveZapper(lnurl) : deriveZapperForPubkey(event.pubkey)
  $: muted = $userMutedEvents.has(event.id) || $userMutedEvents.has(getAddress(event))
  $: pinned = $userPins.has(event.id)
  $: children = $context.filter(e => isChildOf(e, event))
  $: likes = uniqBy(prop("pubkey"), children.filter(spec({kind: REACTION})))
  $: zaps = deriveValidZaps(children.filter(spec({kind: ZAP_RESPONSE})), event)
  $: replies = sortEventsDesc(children.filter(e => replyKinds.includes(e.kind)))
  $: disableActions = !$signer || (muted && !showHidden)
  $: liked = likes.find(e => e.pubkey === $pubkey)
  $: $likesCount = likes.length
  $: zapped = $zaps.find(e => e.request.pubkey === $pubkey)
  $: $zapsTotal = sum(pluck("invoiceAmount", $zaps)) / 1000
  $: canZap = $zapper?.allowsNostr && event.pubkey !== $pubkey
  $: replied = replies.find(e => e.pubkey === $pubkey)
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
          onClick: () => mutePrivately(["e", event.id]),
        })
      }

      actions.push({label: "Report", icon: "triangle-exclamation", onClick: report})
    }

    if (isSignedEvent(event)) {
      actions.push({label: "Broadcast", icon: "rss", onClick: broadcast})
    }

    if (event.pubkey === $pubkey) {
      actions.push({
        label: "Delete",
        icon: "trash",
        onClick: deleteNote,
      })
    }

    if (!pinned) {
      actions.push({
        label: "Pin",
        icon: "thumbtack",
        onClick: () => {
          pin(["e", event.id])
        },
      })
    } else {
      actions.push({
        label: "Unpin",
        icon: "thumbtack-slash",
        onClick: () => {
          unpin(event.id)
        },
      })
    }

    actions.push({
      label: "Details",
      icon: "info",
      onClick: () => setView("info"),
    })
  }
</script>

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
      on:click={onReplyStart}>
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
          "pointer-events-none opacity-50": disableActions || event.pubkey === $pubkey,
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
    {#if pow > 15}
      <Popover triggerType="mouseenter">
        <div
          slot="trigger"
          class="flex h-6 items-center gap-1 rounded bg-neutral-800 px-2 text-xs text-neutral-100 transition-colors dark:bg-neutral-600 dark:hover:bg-neutral-500">
          <i class="fa fa-hammer text-accent" />
          <span>{pow}</span>
        </div>
        <div slot="tooltip" class="px-1">This event cost {pow} bits of work</div>
      </Popover>
    {/if}
    {#if event.wrap}
      <div
        class="staatliches flex h-6 items-center gap-1 rounded bg-neutral-800 px-2 text-neutral-100 transition-colors dark:bg-neutral-600 dark:hover:bg-neutral-500">
        <i class="fa fa-lock text-xs sm:text-accent" />
        <span class="hidden sm:inline">Encrypted</span>
      </div>
    {/if}
    {#if $seenOn?.length > 0}
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
    <NoteInfo {event} {handlers} {children} />
  </Modal>
{/if}
