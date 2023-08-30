<script>
  import cx from "classnames"
  import {nip19} from "nostr-tools"
  import {tweened} from "svelte/motion"
  import {find, reject, identity, propEq, sum, pluck, sortBy} from "ramda"
  import {stringToHue, formatSats, hsl} from "src/util/misc"
  import {isLike, toNostrURI} from "src/util/nostr"
  import {quantify} from "hurdak"
  import {modal} from "src/partials/state"
  import Popover from "src/partials/Popover.svelte"
  import Content from "src/partials/Content.svelte"
  import Modal from "src/partials/Modal.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {toastProgress} from "src/app/state"
  import {Env, Nip57, Builder, Nip65, Keys, Outbox, user} from "src/app/engine"

  export let note
  export let reply
  export let muted
  export let showEntire
  export let setFeedRelay

  const zapper = Nip57.zappers.key(note.pubkey)
  const nevent = nip19.neventEncode({id: note.id, relays: [note.seen_on]})
  const interpolate = (a, b) => t => a + Math.round((b - a) * t)
  const likesCount = tweened(0, {interpolate})
  const zapsTotal = tweened(0, {interpolate})
  const repliesCount = tweened(0, {interpolate})

  const report = () => modal.push({type: "report/create", note})

  const label = () => modal.push({type: "label/create", note})

  const quote = () => modal.push({type: "note/create", quote: note})

  const unmute = () => user.unmute(note.id)

  const mute = () => user.mute("e", note.id)

  const react = async content => {
    like = await Outbox.prep(Builder.createReaction(note, content))

    Outbox.publish({
      event: like,
      relays: Nip65.getPublishHints(5, note, user.getRelayUrls("write")),
    })
  }

  const deleteReaction = e => {
    Outbox.publish({
      event: Builder.deleteEvents([e.id]),
      relays: Nip65.getPublishHints(3, note, user.getRelayUrls("write")),
    })

    like = null
    likes = reject(propEq("id", e.id), likes)
  }

  const startZap = () => {
    modal.push({type: "zap/create", note, pubkey: note.pubkey})
  }

  const broadcast = () => {
    Outbox.publish({
      event: note,
      relays: user.getRelayUrls("write"),
      onProgress: toastProgress,
    })
  }

  let like, likes, allLikes, zap, zaps
  let actions = []
  let showDetails = false

  $: disableActions = !Keys.canSign.get() || muted
  $: likes = note.reactions.filter(n => isLike(n.content))
  $: like = like || find(propEq("pubkey", Keys.pubkey.get()), likes)
  $: allLikes = like ? likes.filter(n => n.id !== like?.id).concat(like) : likes
  $: $likesCount = allLikes.length

  $: zaps = Nip57.processZaps(note.zaps, note.pubkey)
  $: zap = zap || find(z => z.request.pubkey === Keys.pubkey.get(), zaps)

  $: $zapsTotal =
    sum(
      pluck(
        "invoiceAmount",
        zap
          ? zaps.filter(n => n.id !== zap?.id).concat(Nip57.processZaps([zap], note.pubkey))
          : zaps
      )
    ) / 1000

  $: canZap = $zapper && note.pubkey !== Keys.pubkey.get()
  $: $repliesCount = note.replies.length

  $: {
    actions = []

    actions.push({label: "Quote", icon: "quote-left", onClick: quote})

    if (muted) {
      actions.push({label: "Unmute", icon: "microphone", onClick: unmute})
    } else {
      actions.push({label: "Mute", icon: "microphone-slash", onClick: mute})
    }

    if (Env.FORCE_RELAYS.length === 0) {
      actions.push({label: "Broadcast", icon: "rss", onClick: broadcast})

      actions.push({
        label: "Details",
        icon: "info",
        onClick: () => {
          showDetails = true
        },
      })
    }

    actions.push({label: "Tag", icon: "tag", onClick: label})
    actions.push({label: "Report", icon: "triangle-exclamation", onClick: report})
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
        "pointer-events-none opacity-50": disableActions || note.pubkey === Keys.pubkey.get(),
        "text-accent": like,
      })}
      on:click={() => (like ? deleteReaction(like) : react("+"))}>
      <i
        class={cx("fa fa-heart cursor-pointer", {
          "fa-beat fa-beat-custom": like,
        })} />
      {$likesCount}
    </button>
    {#if Env.ENABLE_ZAPS}
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
    {#if Env.FORCE_RELAYS.length === 0}
      <!-- Mobile version -->
      <div
        style="transform: scale(-1, 1)"
        class="absolute right-0 top-0 m-3 grid grid-cols-3 gap-2 sm:hidden">
        {#each sortBy(identity, note.seen_on || []) as url, i}
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
        {#each sortBy(identity, note.seen_on || []) as url, i}
          <Popover triggerType="mouseenter" interactive={false}>
            <div slot="trigger" class="cursor-pointer p-1">
              <div
                class="h-3 w-3 rounded-full border border-solid border-gray-6"
                style={`background: ${hsl(stringToHue(url))}`}
                on:click={() => setFeedRelay?.({url})} />
            </div>
            <div slot="tooltip">{Nip65.displayRelay({url})}</div>
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
