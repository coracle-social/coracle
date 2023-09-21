<script lang="ts">
  import cx from "classnames"
  import {nip19} from "nostr-tools"
  import {tweened} from "svelte/motion"
  import {find, pathEq, reject, identity, propEq, sum, pluck, sortBy} from "ramda"
  import {stringToHue, formatSats, hsl} from "src/util/misc"
  import {fromDisplayEvent, getIdOrNaddr, toNostrURI} from "src/util/nostr"
  import {quantify} from "hurdak"
  import {modal, toast} from "src/partials/state"
  import Popover from "src/partials/Popover.svelte"
  import Content from "src/partials/Content.svelte"
  import Modal from "src/partials/Modal.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
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
    publishReaction,
    processZap,
    displayRelay,
    getEventHints,
  } from "src/engine"

  export let note: Event
  export let reply
  export let muted
  export let showEntire
  export let setFeedRelay
  export let replies
  export let likes
  export let zaps

  const person = people.key(note.pubkey)
  const nevent = nip19.neventEncode({id: note.id, relays: getEventHints(note)})
  const interpolate = (a, b) => t => a + Math.round((b - a) * t)
  const likesCount = tweened(0, {interpolate})
  const zapsTotal = tweened(0, {interpolate})
  const repliesCount = tweened(0, {interpolate})

  //const report = () => modal.push({type: "report/create", note})

  const label = () => modal.push({type: "label/create", note})

  const quote = () => modal.push({type: "note/create", quote: note})

  const unmuteNote = () => unmute(note.id)

  const muteNote = () => mute("e", note.id)

  const react = async content => {
    const pub = await publishReaction(note, content)

    like = pub.event
  }

  const deleteReaction = e => {
    publishDeletion([getIdOrNaddr(e)])

    like = null
    likes = reject(propEq("id", e.id), likes)
  }

  const startZap = () => {
    modal.push({type: "zap/create", note, pubkey: note.pubkey})
  }

  const broadcast = () => {
    const relays = getUserRelayUrls("write")
    const event = fromDisplayEvent(note)

    Publisher.publish({event, relays})

    toast.show("info", "Note has been re-published!")
  }

  let like, allLikes, zap
  let showDetails = false
  let actions = []

  $: disableActions = !$canSign || muted
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

    if (muted) {
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
        class={cx("relative w-20 pt-1 text-left transition-all hover:pb-1 hover:pt-0", {
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
            <div
              class="h-3 w-3 rounded-full border border-solid border-gray-6"
              style={`background: ${hsl(stringToHue(url))}`}
              on:click={() => setFeedRelay?.({url})} />
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
              <div
                class="h-3 w-3 rounded-full border border-solid border-gray-6"
                style={`background: ${hsl(stringToHue(url))}`}
                on:click={() => setFeedRelay?.({url})} />
            </div>
            <div slot="tooltip">{displayRelay({url})}</div>
          </Popover>
        {/each}
      </div>
    {/if}
    <div class="ml-2">
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
    </Content>
  </Modal>
{/if}
