<script lang="ts">
  import {onDestroy} from "svelte"
  import {dec, inc} from "ramda"
  import {switcherFn} from "hurdak"
  import {throttle} from "throttle-debounce"
  import {Tags} from "src/util/nostr"
  import {AudioController} from "src/util/audio"
  import Audio from "src/partials/Audio.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import NoteContentLabel from "src/app/shared/NoteContentLabel.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import {FeedLoader, compileFilter, getRelaysFromFilters} from "src/engine"
  import {router} from "src/app/router"

  export let isOpen

  const filters = [compileFilter({kinds: [1808, 32123]})]

  const hints = ["wss://relay.stemstr.app", "wss://relay.wavlake.com"]
  const relays = getRelaysFromFilters(filters).concat(hints)

  const feed = new FeedLoader({filters, relays})

  const close = () => {
    isOpen = false
  }

  const prev = () => {
    controller?.cleanup()
    controller = null

    i = Math.max(0, dec(i))
  }

  const next = () => {
    controller?.cleanup()
    controller = null

    i = Math.min($feed.length - 1, inc(i))
  }

  const loadMore = throttle(5000, () => feed.load(1))

  const showNote = () => {
    close()
    router
      .at("notes")
      .of(note.id)
      .qp({relays: note.seen_on})
      .cx({context: [note]})
      .open()
  }

  const showPerson = () => {
    close()
    router.at("people").of(note.pubkey).qp({relays: note.seen_on}).open()
  }

  const getStreamUrl = e =>
    switcherFn(e.kind, {
      1808: () => Tags.from(e).asMeta().stream_url,
      32123: () => JSON.parse(e.content).enclosure,
    })

  let i = 0
  let playing = false
  let controller

  $: note = $feed[i]

  $: {
    if (!controller && note) {
      const url = getStreamUrl(note)

      if (url) {
        controller = new AudioController(url)

        controller.on("completed", () => {
          setTimeout(next, 1000)
        })

        controller.on("play", () => {
          playing = true
        })

        controller.on("pause", () => {
          playing = false
        })

        if (playing) {
          controller.play()
        }
      }
    }
  }

  $: {
    if ($feed.slice(i).length < 5) {
      loadMore()
    }
  }

  onDestroy(() => {
    feed.stop()
    controller?.cleanup()
  })
</script>

{#if isOpen}
  <Modal mini onEscape={close}>
    <Content>
      {#if controller}
        {#key controller.url}
          <div class="flex justify-between gap-8">
            <i
              class="fa fa-2x fa-backward-step cursor-pointer"
              class:opacity-50={i === 0}
              on:click={prev} />
            <div class="text-overflow-nowrap flex min-w-0 flex-grow flex-col gap-4 overflow-hidden">
              <Audio autoCleanup={false} {controller} />
              <Anchor on:click={showPerson}>
                <PersonBadge inert pubkey={note.pubkey} />
              </Anchor>
              <div class="flex gap-2">
                <Anchor on:click={showNote}>
                  <i class="fa fa-link text-accent" />
                </Anchor>
                {#if note.kind === 1808}
                  <NoteContentKind1 showEntire {note} />
                {:else}
                  {@const {title, creator} = JSON.parse(note.content)}
                  <p>{title} by {creator}</p>
                {/if}
              </div>
              <NoteContentLabel type="t" {note} />
            </div>
            <i
              class="fa fa-2x fa-forward-step cursor-pointer"
              class:opacity-50={i >= $feed.length - 1}
              on:click={next} />
          </div>
        {/key}
      {:else}
        <Spinner>Looking for music from your network...</Spinner>
      {/if}
    </Content>
  </Modal>
{/if}
