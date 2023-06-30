<script lang="ts">
  import cx from "classnames"
  import {nip19} from "nostr-tools"
  import {tweened} from "svelte/motion"
  import {find, reject, identity, propEq, pathEq, sum, pluck, sortBy} from "ramda"
  import {stringToHue, formatSats, hsl} from "src/util/misc"
  import {displayRelay, isLike} from "src/util/nostr"
  import {quantify, first} from "hurdak/lib/hurdak"
  import {modal} from "src/partials/state"
  import Popover from "src/partials/Popover.svelte"
  import Content from "src/partials/Content.svelte"
  import Modal from "src/partials/Modal.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {ENABLE_ZAPS, keys, nip57} from "src/system"
  import {getEventPublishRelays} from "src/agent/relays"
  import pool from "src/agent/pool"
  import user from "src/agent/user"
  import cmd from "src/agent/cmd"

  export let note
  export let reply
  export let muted
  export let showEntire
  export let setFeedRelay

  const {canSign} = keys
  const zapper = nip57.zappers.get(note.pubkey)
  const bech32Note = nip19.noteEncode(note.id)
  const nevent = nip19.neventEncode({id: note.id, relays: [note.seen_on]})
  const interpolate = (a, b) => t => a + Math.round((b - a) * t)
  const likesCount = tweened(0, {interpolate})
  const zapsTotal = tweened(0, {interpolate})
  const repliesCount = tweened(0, {interpolate})

  const share = () => {
    modal.push({type: "note/share", note})
  }

  const quote = () => modal.push({type: "note/create", quote: note})
  const mute = () => user.addMute("e", note.id)
  const unmute = () => user.removeMute(note.id)
  const deleteSelf = () => modal.push({type: "note/delete", note})

  const react = async content => {
    like = first(await cmd.createReaction(note, content).publish(getEventPublishRelays(note)))
  }

  const deleteReaction = e => {
    cmd.deleteEvent([e.id]).publish(getEventPublishRelays(note))

    like = null
    likes = reject(propEq("id", e.id), likes)
  }

  const startZap = () => {
    modal.push({type: "note/zap", note})
  }

  let like, likes, allLikes, zap, zaps, allZaps
  let actions = []
  let showDetails = false

  $: disableActions = !$canSign || muted
  $: likes = note.reactions.filter(n => isLike(n.content))
  $: like = like || find(propEq("pubkey", user.getPubkey()), likes)
  $: allLikes = like ? likes.filter(n => n.id !== like?.id).concat(like) : likes
  $: $likesCount = allLikes.length

  $: zaps = nip57.processZaps(note.zaps, note.pubkey)
  $: zap = zap || find(pathEq(["request", "pubkey"], user.getPubkey()), zaps)
  $: allZaps = zap
    ? zaps.filter(n => n.id !== zap?.id).concat(nip57.processZaps([zap], note.pubkey))
    : zaps
  $: $zapsTotal = sum(pluck("invoiceAmount", allZaps)) / 1000

  $: canZap = zapper && note.pubkey !== user.getPubkey()
  $: $repliesCount = note.replies.length

  $: {
    actions = []

    actions.push({label: "Share", icon: "share-nodes", onClick: share})
    actions.push({label: "Quote", icon: "quote-left", onClick: quote})

    if (note.pubkey === user.getPubkey()) {
      actions.push({label: "Delete", icon: "trash", onClick: deleteSelf})
    }

    if (muted) {
      actions.push({label: "Unmute", icon: "microphone", onClick: unmute})
    } else {
      actions.push({label: "Mute", icon: "microphone-slash", onClick: mute})
    }

    if (pool.forceUrls.length === 0) {
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
      class={cx("w-16 text-left", {
        "pointer-events-none opacity-50": disableActions,
      })}
      on:click={reply.start}>
      <i class="fa fa-reply cursor-pointer" />
      {$repliesCount}
    </button>
    <button
      class={cx("w-16 text-left", {
        "pointer-events-none opacity-50": disableActions || note.pubkey === user.getPubkey(),
        "text-accent": like,
      })}
      on:click={() => (like ? deleteReaction(like) : react("+"))}>
      <i
        class={cx("fa fa-heart cursor-pointer", {
          "fa-beat fa-beat-custom": like,
        })} />
      {$likesCount}
    </button>
    {#if ENABLE_ZAPS}
      <button
        class={cx("w-20 text-left", {
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
    {#if pool.forceUrls.length === 0}
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
              <span class="ml-6 text-sm text-gray-5"
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
      <CopyValue label="Identifier" value={nevent} />
      <CopyValue label="Event ID (note)" value={bech32Note} />
      <CopyValue label="Event ID (hex)" value={note.id} />
    </Content>
  </Modal>
{/if}
