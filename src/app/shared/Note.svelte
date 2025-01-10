<script lang="ts">
  import {ctx} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {getIdOrAddress} from "@welshman/util"
  import NoteActions from "src/app/shared/NoteActions.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import NoteHeader from "src/app/shared/NoteHeader.svelte"
  import NoteReply from "src/app/shared/NoteReply.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import {router} from "src/app/util"
  import {headerlessKinds} from "src/util/nostr"
  import {getSetting, isEventMuted} from "src/engine"

  export let note: TrustedEvent
  export let depth = 0
  export let showEntire = false
  export let showMedia = getSetting("show_media")
  export let showParent = true
  export let interactive = true

  let showHidden = false

  const onClick = e => {
    const target = (e.detail?.target || e.target) as HTMLElement

    if (interactive && !["I"].includes(target.tagName) && !target.closest("a")) {
      router
        .at("notes")
        .of(getIdOrAddress(note), {relays: ctx.app.router.Event(note).getUrls()})
        .open()
    }
  }

  $: hidden = $isEventMuted(note, true)
</script>

<div class="group relative">
  <Card stopPropagation class="relative" on:click={onClick} {interactive}>
    {#if !headerlessKinds.includes(note.kind)}
      <NoteHeader event={note} {showParent} />
    {/if}
    {#if hidden && !showHidden}
      <p class="border-l-2 border-solid border-neutral-600 pl-4 text-neutral-100">
        You have hidden this note.
        <Anchor
          underline
          on:click={() => {
            showHidden = true
          }}>Show</Anchor>
      </p>
    {:else}
      <div class:!pl-0={headerlessKinds.includes(note.kind)} class="mt-2 pl-14">
        <NoteContent {note} {depth} {showEntire} {showMedia} />
      </div>
      <div class:!pl-10={headerlessKinds.includes(note.kind)} class="pl-14 pt-4">
        <NoteActions event={note} />
      </div>
    {/if}
  </Card>
  <NoteReply parent={note} />
</div>
