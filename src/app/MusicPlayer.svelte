<script lang="ts">
  import {onDestroy} from "svelte"
  import {dec, inc} from "ramda"
  import {throttle} from "throttle-debounce"
  import {Tags} from "src/util/nostr"
  import {AudioController} from "src/util/audio"
  import {modal} from "src/partials/state"
  import Audio from "src/partials/Audio.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import NoteContentLabel from "src/app/shared/NoteContentLabel.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import {FeedLoader, compileFilter, getRelaysFromFilters} from "src/engine"

  export let isOpen

  const filters = [
    compileFilter({kinds: [1808], authors: "follows", limit: 10}),
    compileFilter({kinds: [1808], authors: "network", limit: 10}),
  ]

  const relays = getRelaysFromFilters(filters)

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

  const loadMore = throttle(10000, () => feed.load(10))

  const goToPerson = () => modal.push({type: "person/detail", pubkey: note.pubkey})

  let i = 0
  let playing = false
  let controller

  $: note = $feed[i]

  $: {
    if (!controller && note) {
      const url = Tags.from(note).asMeta().stream_url

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
    if ($feed.slice(i).length < 10) {
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
              <Anchor on:click={goToPerson}>
                <PersonBadge inert pubkey={note.pubkey} />
              </Anchor>
              <NoteContentKind1 showEntire {note} />
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
