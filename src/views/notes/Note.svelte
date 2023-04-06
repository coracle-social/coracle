<script lang="ts">
  import cx from "classnames"
  import {nip19} from "nostr-tools"
  import {find, sum, last, whereEq, without, uniq, pluck, reject, propEq} from "ramda"
  import {onMount} from "svelte"
  import {tweened} from "svelte/motion"
  import {slide} from "svelte/transition"
  import {quantify} from "hurdak/lib/hurdak"
  import {warn} from "src/util/logger"
  import {Tags, displayRelay, findRootId, findReplyId, displayPerson, isLike} from "src/util/nostr"
  import {
    stringToHue,
    hsl,
    formatTimestamp,
    now,
    tryJson,
    formatSats,
    fetchJson,
  } from "src/util/misc"
  import {isMobile, copyToClipboard} from "src/util/html"
  import {invoiceAmount} from "src/util/lightning"
  import QRCode from "src/partials/QRCode.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import Input from "src/partials/Input.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import Content from "src/partials/Content.svelte"
  import Badge from "src/partials/Badge.svelte"
  import Popover from "src/partials/Popover.svelte"
  import PersonCircle from "src/partials/PersonCircle.svelte"
  import PersonSummary from "src/views/person/PersonSummary.svelte"
  import RelayCard from "src/views/relays/RelayCard.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Media from "src/partials/Media.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {toast, modal} from "src/app/ui"
  import Compose from "src/partials/Compose.svelte"
  import Card from "src/partials/Card.svelte"
  import user from "src/agent/user"
  import pool from "src/agent/pool"
  import keys from "src/agent/keys"
  import network from "src/agent/network"
  import {getEventPublishRelays, getRelaysForEventParent} from "src/agent/relays"
  import {getPersonWithFallback} from "src/agent/tables"
  import {watch} from "src/agent/storage"
  import cmd from "src/agent/cmd"
  import {routes, globalRelay} from "src/app/ui"
  import {publishWithToast} from "src/app"
  import NoteContent from "src/views/notes/NoteContent.svelte"

  export let note
  export let depth = 0
  export let anchorId = null
  export let showParent = true
  export let showContext = false
  export let invertColors = false

  const getDefaultReplyMentions = () =>
    without([user.getPubkey()], uniq(Tags.from(note).type("p").values().all().concat(note.pubkey)))

  let zap = null
  let image = null
  let reply = null
  let replyMentions = getDefaultReplyMentions()
  let replyContainer = null
  let visibleNotes = []
  let showDetails = false
  let collapsed = false

  const {profile, canPublish, mutes} = user
  const timestamp = formatTimestamp(note.created_at)
  const borderColor = invertColors ? "gray-6" : "gray-7"
  const showEntire = anchorId === note.id
  const interactive = !anchorId || !showEntire
  const person = watch("people", () => getPersonWithFallback(note.pubkey))
  const nevent = nip19.neventEncode({id: note.id, relays: [note.seen_on]})
  const bech32Note = nip19.noteEncode(note.id)

  let likes, zaps, like, border, childrenContainer, noteContainer, canZap, actions
  let muted = false

  const interpolate = (a, b) => t => a + Math.round((b - a) * t)
  const likesCount = tweened(0, {interpolate})
  const zapsTotal = tweened(0, {interpolate})
  const repliesCount = tweened(0, {interpolate})

  $: muted = find(m => m[1] === note.id, $mutes)
  $: likes = note.reactions.filter(n => isLike(n.content))
  $: zaps = note.zaps
    .map(zap => {
      const zapMeta = Tags.from(zap).asMeta()

      return tryJson(() => ({
        ...zap,
        invoiceAmount: invoiceAmount(zapMeta.bolt11),
        request: JSON.parse(zapMeta.description),
      }))
    })
    .filter(zap => {
      if (!zap) {
        return false
      }

      // Don't count zaps that the user sent himself
      if (zap.request.pubkey === $person.pubkey) {
        return false
      }

      const {invoiceAmount, request} = zap
      const reqMeta = Tags.from(request).asMeta()

      // Verify that the zapper actually sent the requested amount (if it was supplied)
      if (reqMeta.amount && parseInt(reqMeta.amount) !== invoiceAmount) {
        return false
      }

      // If the sending client provided an lnurl tag, verify that too
      if (reqMeta.lnurl && reqMeta.lnurl !== $person?.lnurl) {
        return false
      }

      // Verify that the zap note actually came from the recipient's zapper
      if ($person.zapper?.nostrPubkey !== zap.pubkey) {
        return false
      }

      return true
    })

  $: like = find(whereEq({pubkey: $profile?.pubkey}), likes)
  $: zapped = find(z => z.request.pubkey === $profile?.pubkey, zaps)
  $: $likesCount = likes.length
  $: $zapsTotal = sum(zaps.map(zap => zap.invoiceAmount)) / 1000
  $: $repliesCount = note.replies.length
  $: visibleNotes = note.replies.filter(r => (showContext ? true : !r.isContext))
  $: canZap = $person?.zapper && $person?.pubkey !== user.getPubkey()
  $: {
    actions = []

    actions.push({label: "Share", icon: "share-nodes", onClick: copyLink})
    actions.push({label: "Quote", icon: "quote-left", onClick: quote})

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

  const onClick = e => {
    const target = e.target as HTMLElement

    if (interactive && !["I"].includes(target.tagName) && !target.closest("a")) {
      modal.set({type: "note/detail", note})
    }
  }

  const goToParent = async () => {
    const relays = getRelaysForEventParent(note)

    modal.set({type: "note/detail", note: {id: findReplyId(note)}, relays})
  }

  const goToRoot = async () => {
    const relays = getRelaysForEventParent(note)

    modal.set({type: "note/detail", note: {id: findRootId(note)}, relays})
  }

  const mute = async () => {
    user.addMute("e", note.id)
  }

  const unmute = async () => {
    user.removeMute(note.id)
  }

  const react = async content => {
    const relays = getEventPublishRelays(note)
    const [event] = await cmd.createReaction(note, content).publish(relays)

    likes = likes.concat(event)
  }

  const deleteReaction = e => {
    cmd.deleteEvent([e.id]).publish(getEventPublishRelays(note))

    likes = reject(propEq("pubkey", $profile.pubkey), likes)
  }

  const startReply = () => {
    reply = reply || true
  }

  const removeMention = pubkey => {
    replyMentions = without([pubkey], replyMentions)
  }

  const resetReply = () => {
    reply = null
    replyMentions = getDefaultReplyMentions()
  }

  const sendReply = async () => {
    let {content, mentions, topics} = reply.parse()

    if (image) {
      content = (content + "\n" + image).trim()
    }

    if (content) {
      mentions = uniq(mentions.concat(replyMentions))

      const relays = getEventPublishRelays(note)
      const thunk = cmd.createReply(note, content, mentions, topics)
      const [event, promise] = await publishWithToast(relays, thunk)

      promise.then(({succeeded}) => {
        if (succeeded.size > 0) {
          toast.show("info", {
            text: `Your note has been created!`,
            link: {
              text: "View",
              href:
                "/" +
                nip19.neventEncode({
                  id: event.id,
                  relays: pluck("url", relays.slice(0, 3)),
                }),
            },
          })
        }
      })

      resetReply()
    }
  }

  const startZap = async () => {
    zap = {
      amount: user.getSetting("defaultZap"),
      message: "",
      invoice: null,
      loading: false,
      startedAt: now(),
      confirmed: false,
    }
  }

  const loadZapInvoice = async () => {
    zap.loading = true

    const {zapper, lnurl} = $person
    const amount = zap.amount * 1000
    const relays = getEventPublishRelays(note)
    const urls = pluck("url", relays)
    const publishable = cmd.requestZap(urls, zap.message, note.pubkey, note.id, amount, lnurl)
    const event = encodeURI(JSON.stringify(await keys.sign(publishable.event)))
    const res = await fetchJson(`${zapper.callback}?amount=${amount}&nostr=${event}&lnurl=${lnurl}`)

    // If they closed the dialog before fetch resolved, we're done
    if (!zap) {
      return
    }

    if (!res.pr) {
      throw new Error(JSON.stringify(res))
    }

    zap.invoice = res.pr
    zap.loading = false

    // Open up alby or whatever
    const {webln} = window as {webln?: any}
    if (webln) {
      await webln.enable()

      try {
        webln.sendPayment(zap.invoice)
      } catch (e) {
        warn(e)
      }
    }

    // Listen for the zap confirmation
    zap.sub = network.listen({
      relays,
      filter: {
        kinds: [9735],
        authors: [zapper.nostrPubkey],
        "#p": [$person.pubkey],
        since: zap.startedAt,
      },
      onChunk: chunk => {
        note.zaps = note.zaps.concat(chunk)

        zap.confirmed = true

        setTimeout(cleanupZap, 1000)
      },
    })
  }

  const cleanupZap = () => {
    if (zap) {
      zap.sub?.then(s => s.unsub())
      zap = null
    }
  }

  const copyLink = () => {
    const nevent = nip19.neventEncode({id: note.id, relays: note.seen_on})

    copyToClipboard("nostr:" + nevent)
    toast.show("info", "Note link copied to clipboard!")
  }

  const quote = () => {
    const nevent = nip19.neventEncode({id: note.id, relays: note.seen_on})

    modal.set({type: "note/create", nevent})
  }

  const onBodyClick = e => {
    const target = e.target as HTMLElement

    if (replyContainer && !replyContainer.contains(target)) {
      resetReply()
    }
  }

  const setBorderHeight = () => {
    const getHeight = e => e?.getBoundingClientRect().height || 0

    if (childrenContainer && noteContainer) {
      const lastChild = last(
        [].slice.apply(childrenContainer.children).filter(e => e.matches(".note"))
      )

      if (lastChild) {
        const height =
          66 +
          getHeight(childrenContainer) -
          getHeight(lastChild) -
          getHeight(lastChild.nextElementSibling) -
          (lastChild.nextElementSibling ? 16 : 0)

        border.style = `height: ${height - 21}px`
      }
    }
  }

  onMount(() => {
    const interval = setInterval(setBorderHeight, 300)

    return () => {
      clearInterval(interval)
      cleanupZap()
    }
  })
</script>

<svelte:body on:click={onBodyClick} />

{#if $person}
  <div bind:this={noteContainer} class="note group relative">
    <Card class="relative flex gap-4" on:click={onClick} {interactive} {invertColors}>
      {#if !showParent}
        <div
          class={`absolute -ml-4 h-px w-4 bg-${borderColor} z-10`}
          style="left: 0px; top: 27px;" />
      {/if}
      <div>
        <Anchor class="text-lg font-bold" href={routes.person($person.pubkey)}>
          <PersonCircle size={10} person={$person} />
        </Anchor>
      </div>
      <div class="flex min-w-0 flex-grow flex-col gap-2">
        <div class="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <Popover triggerType={isMobile ? "click" : "mouseenter"}>
            <div slot="trigger">
              <Anchor
                type="unstyled"
                class="flex items-center gap-2 text-lg font-bold"
                href={isMobile ? null : routes.person($person.pubkey)}>
                <span>{displayPerson($person)}</span>
                {#if $person.verified_as}
                  <i class="fa fa-circle-check text-sm text-accent" />
                {/if}
              </Anchor>
            </div>
            <div slot="tooltip">
              <PersonSummary pubkey={$person.pubkey} />
            </div>
          </Popover>
          <Anchor
            href={"/" + nip19.neventEncode({id: note.id, relays: note.seen_on})}
            class="text-sm text-gray-1"
            type="unstyled">
            {timestamp}
          </Anchor>
        </div>
        <div class="flex flex-col gap-2">
          <div class="flex gap-2">
            {#if findReplyId(note) && showParent}
              <small class="text-gray-1">
                <i class="fa fa-code-merge" />
                <Anchor on:click={goToParent}>View Parent</Anchor>
              </small>
            {/if}
            {#if findRootId(note) && findRootId(note) !== findReplyId(note) && showParent}
              <small class="text-gray-1">
                <i class="fa fa-code-pull-request" />
                <Anchor on:click={goToRoot}>View Thread</Anchor>
              </small>
            {/if}
          </div>
          {#if muted}
            <p class="border-l-2 border-solid border-gray-6 pl-4 text-gray-1">
              You have muted this note.
            </p>
          {:else}
            <NoteContent {note} {showEntire} />
          {/if}
          <div class="flex justify-between text-gray-1">
            <div
              class={cx("flex", {
                "pointer-events-none opacity-75": !$canPublish || muted,
              })}>
              <button class="w-16 text-left" on:click|stopPropagation={startReply}>
                <i class="fa fa-reply cursor-pointer" />
                {$repliesCount}
              </button>
              <button
                class="w-16 text-left"
                class:text-accent={like}
                on:click|stopPropagation={() => (like ? deleteReaction(like) : react("+"))}>
                <i
                  class={cx("fa fa-heart cursor-pointer", {
                    "fa-beat fa-beat-custom": like,
                  })} />
                {$likesCount}
              </button>
              <button
                class={cx("w-20 text-left", {
                  "pointer-events-none opacity-50": !canZap,
                })}
                class:text-accent={zapped}
                on:click|stopPropagation={startZap}>
                <i class="fa fa-bolt cursor-pointer" />
                {formatSats($zapsTotal)}
              </button>
            </div>
            <div on:click|stopPropagation class="flex items-center">
              {#if pool.forceUrls.length === 0}
                <div class="hidden group-hover:flex">
                  {#each note.seen_on as url}
                    <Popover triggerType="mouseenter">
                      <div slot="trigger" class="p-1">
                        <div
                          class="h-3 w-3 rounded-full border border-solid border-gray-6"
                          style={`background: ${hsl(stringToHue(url))}`}
                          on:click={() => globalRelay.set(url)} />
                      </div>
                      <div slot="tooltip">
                        {displayRelay({url})}
                      </div>
                    </Popover>
                  {/each}
                </div>
              {/if}
              <div class="ml-2">
                <OverflowMenu {actions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>

  {#if reply}
    <div
      transition:slide
      class="note-reply relative z-10 flex flex-col gap-1"
      bind:this={replyContainer}>
      <div class={`border border-${borderColor} rounded border-solid`}>
        <div class="bg-gray-7" class:rounded-b={replyMentions.length === 0}>
          <Compose bind:this={reply} onSubmit={sendReply}>
            <button
              slot="addon"
              on:click={sendReply}
              class="flex cursor-pointer flex-col justify-center gap-2 border-l border-solid border-gray-7 p-4
                 py-8 text-gray-3 transition-all hover:bg-accent">
              <i class="fa fa-paper-plane fa-xl" />
            </button>
          </Compose>
        </div>
        {#if image}
          <div class="bg-gray-7 p-2">
            <Media
              link={{type: "image", url: image}}
              onClose={() => {
                image = null
              }} />
          </div>
        {/if}
        <div class={`h-px bg-${borderColor}`} />
        <div class="flex gap-2 rounded-b bg-gray-7 p-2 text-sm text-gray-3">
          <div class="inline-block border-r border-solid border-gray-6 py-2 pl-1 pr-3">
            <div class="flex cursor-pointer items-center gap-3">
              <ImageInput bind:value={image} icon="image" hideInput>
                <i slot="button" class="fa fa-paperclip" />
              </ImageInput>
              <i class="fa fa-at" />
            </div>
          </div>
          <div>
            {#each replyMentions as p}
              <div
                class="mr-1 mb-1 inline-block rounded-full border border-solid border-gray-1 py-1 px-2">
                <button
                  class="fa fa-times cursor-pointer"
                  on:click|stopPropagation={() => removeMention(p)} />
                {displayPerson(getPersonWithFallback(p))}
              </div>
            {:else}
              <div class="text-gray-1 inline-block">No mentions</div>
            {/each}
            <div class="-mb-2" />
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2 text-sm text-gray-5">
        <span>
          Posting as @{displayPerson(getPersonWithFallback(user.getPubkey()))}
        </span>
      </div>
    </div>
  {/if}

  {#if !reply && visibleNotes.length > 0 && !showEntire && depth > 0 && !muted}
    <div class="relative -mt-4">
      <div
        class="absolute top-0 right-0 z-10 -mt-4 -mr-2 flex h-6 w-6 cursor-pointer items-center
                 justify-center rounded-full border border-solid border-gray-7 bg-gray-8 text-gray-3"
        on:click={() => {
          collapsed = !collapsed
        }}>
        <Popover triggerType="mouseenter">
          <div slot="trigger">
            {#if collapsed}
              <i class="fa fa-xs fa-up-right-and-down-left-from-center" />
            {:else}
              <i class="fa fa-xs fa-down-left-and-up-right-to-center" />
            {/if}
          </div>
          <div slot="tooltip">
            {collapsed ? "Show replies" : "Hide replies"}
          </div>
        </Popover>
      </div>
    </div>
  {/if}

  {#if !collapsed && visibleNotes.length > 0 && depth > 0 && !muted}
    <div class="relative">
      <div class={`absolute w-px bg-${borderColor} z-10 -mt-4 ml-4 h-0`} bind:this={border} />
      <div class="note-children relative ml-8 flex flex-col gap-4" bind:this={childrenContainer}>
        {#if !showEntire && note.replies.length > visibleNotes.length}
          <button class="ml-5 cursor-pointer py-2 text-gray-1" on:click={onClick}>
            <i class="fa fa-up-down pr-2 text-sm" />
            Show {quantify(
              note.replies.length - visibleNotes.length,
              "other reply",
              "more replies"
            )}
          </button>
        {/if}
        {#each visibleNotes as r (r.id)}
          <svelte:self
            showParent={false}
            note={r}
            depth={depth - 1}
            {invertColors}
            {anchorId}
            {showContext} />
        {/each}
      </div>
    </div>
  {/if}

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
                <Badge person={getPersonWithFallback(zap.request.pubkey)} />
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
              <Badge person={getPersonWithFallback(like.pubkey)} />
            {/each}
          </div>
        {/if}
        <h1 class="staatliches text-2xl">Relays</h1>
        <p>This note was found on the {quantify(note.seen_on.length, "relay")} below.</p>
        {#each note.seen_on as url}
          <RelayCard theme="black" showControls relay={{url}} />
        {/each}
        <h1 class="staatliches text-2xl">Details</h1>
        <CopyValue label="Identifier" value={nevent} />
        <CopyValue label="Event ID (note)" value={bech32Note} />
        <CopyValue label="Event ID (hex)" value={note.id} />
      </Content>
    </Modal>
  {/if}

  {#if zap}
    <Modal onEscape={cleanupZap}>
      <Content size="lg">
        <div class="text-center">
          <h1 class="staatliches text-2xl">Send a zap</h1>
          <p>to {displayPerson($person)}</p>
        </div>
        {#if zap.confirmed}
          <div class="flex items-center justify-center gap-2 text-gray-1">
            <i class="fa fa-champagne-glasses" />
            <p>Success! Zap confirmed.</p>
          </div>
        {:else if zap.invoice}
          <QRCode code={zap.invoice} />
          <p class="text-center text-gray-1">
            Copy or scan using a lightning wallet to pay your zap.
          </p>
          <div class="flex items-center justify-center gap-2 text-gray-1">
            <i class="fa fa-circle-notch fa-spin" />
            Waiting for confirmation...
          </div>
        {:else}
          <Textarea bind:value={zap.message} placeholder="Add an optional message" />
          <div class="flex items-center gap-2">
            <label class="flex-grow">Custom amount:</label>
            <Input bind:value={zap.amount}>
              <i slot="before" class="fa fa-bolt" />
              <span slot="after" class="-mt-1">sats</span>
            </Input>
            <Anchor loading={zap.loading} type="button-accent" on:click={loadZapInvoice}>
              Zap!
            </Anchor>
          </div>
        {/if}
      </Content>
    </Modal>
  {/if}
{/if}
