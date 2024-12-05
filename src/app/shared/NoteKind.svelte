<script lang="ts">
  import {ctx} from "@welshman/lib"
  import {
    getIdOrAddress,
    getReplyFilters,
    NOTE,
    REACTION,
    ZAP_RESPONSE,
    type TrustedEvent,
  } from "@welshman/util"
  import NoteContentKind0 from "src/app/shared/NoteContentKind0.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import NoteContentKind10002 from "src/app/shared/NoteContentKind10002.svelte"
  import NoteContentKind1063 from "src/app/shared/NoteContentKind1063.svelte"
  import NoteContentKind1808 from "src/app/shared/NoteContentKind1808.svelte"
  import NoteContentKind1985 from "src/app/shared/NoteContentKind1985.svelte"
  import NoteContentKind1986 from "src/app/shared/NoteContentKind1986.svelte"
  import NoteContentKind3 from "src/app/shared/NoteContentKind3.svelte"
  import NoteContentKind30009 from "src/app/shared/NoteContentKind30009.svelte"
  import NoteContentKind30023 from "src/app/shared/NoteContentKind30023.svelte"
  import NoteContentKind30311 from "src/app/shared/NoteContentKind30311.svelte"
  import NoteContentKind30402 from "src/app/shared/NoteContentKind30402.svelte"
  import NoteContentKind31337 from "src/app/shared/NoteContentKind31337.svelte"
  import NoteContentKind31890 from "src/app/shared/NoteContentKind31890.svelte"
  import NoteContentKind31923 from "src/app/shared/NoteContentKind31923.svelte"
  import NoteContentKind32123 from "src/app/shared/NoteContentKind32123.svelte"
  import NoteContentKind40 from "src/app/shared/NoteContentKind40.svelte"
  import NoteContentKind9735 from "src/app/shared/NoteContentKind9735.svelte"
  import NoteContentKind9802 from "src/app/shared/NoteContentKind9802.svelte"
  import NoteContentKindList from "src/app/shared/NoteContentKindList.svelte"
  import {CUSTOM_LIST_KINDS} from "src/domain"
  import {env, getSetting, isEventMuted, load} from "src/engine"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import {getContentWarning} from "src/util/nostr"
  import {onMount} from "svelte"
  import {router} from "../util"
  import NoteActions from "./NoteActions.svelte"
  import NoteHeader from "./NoteHeader.svelte"

  export let note: TrustedEvent
  export let children: TrustedEvent[]
  export let depth = 0
  export let showEntire = false
  export let showMedia = getSetting("show_media")
  export let interactive = false

  let showHidden = false

  let warning = getSetting("hide_sensitive") ? getContentWarning(note) : null

  const ignoreWarning = () => {
    warning = null
  }

  const onClick = e => {
    const target = (e.detail?.target || e.target) as HTMLElement

    if (interactive && !["I"].includes(target.tagName) && !target.closest("a")) {
      router
        .at("notes")
        .of(getIdOrAddress(note), {relays: ctx.app.router.Event(note).getUrls()})
        .open()
    }
  }

  onMount(() => {
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
      relays: ctx.app.router.Replies(note).getUrls(),
      filters: getReplyFilters([note], {kinds}),
    })
  })

  $: hidden = $isEventMuted(note, true)

  $: console.log("NoteKind", note)
</script>

<div class="group relative pt-4">
  <Card stopPropagation class="relative" on:click={onClick} {interactive}>
    <NoteHeader event={note} />
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
      <div class:blur-sm={env.BLUR_CONTENT} class="ml-14 mt-2">
        {#if warning}
          <div class="flex gap-2 text-neutral-300">
            <i class="fa fa-warning m-1" />
            <p>
              This note has been flagged by the author as "{warning}".<br />
              <Anchor underline on:click={ignoreWarning}>Show anyway</Anchor>
            </p>
          </div>
        {:else if note.kind === 0}
          <NoteContentKind0 {note} />
        {:else if note.kind === 3}
          <NoteContentKind3 {note} {showEntire} />
        {:else if [40, 41].includes(note.kind)}
          <NoteContentKind40 {note} />
        {:else if note.kind === 1808}
          <NoteContentKind1808 {note} {showEntire} />
        {:else if note.kind === 1985}
          <NoteContentKind1985 {note} {showEntire} />
        {:else if note.kind === 9735}
          <NoteContentKind9735 {note} {showEntire} {showMedia} />
        {:else if note.kind === 1986}
          <NoteContentKind1986 {note} {showEntire} />
        {:else if note.kind === 9802}
          <NoteContentKind9802 {note} {showEntire} {showMedia} />
        {:else if note.kind === 1063}
          <NoteContentKind1063 {note} {showMedia} />
        {:else if note.kind === 10002}
          <NoteContentKind10002 {note} />
        {:else if note.kind === 30009}
          <NoteContentKind30009 {note} {showMedia} />
        {:else if note.kind === 30023}
          <NoteContentKind30023 {note} {showEntire} {showMedia} {...$$props} />
        {:else if note.kind === 30311}
          <NoteContentKind30311 {note} {showMedia} />
        {:else if note.kind === 30402}
          <NoteContentKind30402 {note} {showEntire} {showMedia} />
        {:else if note.kind === 31337}
          <NoteContentKind31337 {note} {showMedia} />
        {:else if note.kind === 31890}
          <NoteContentKind31890 {note} />
        {:else if note.kind === 31923}
          <NoteContentKind31923 {note} />
        {:else if note.kind === 32123}
          <NoteContentKind32123 {note} />
        {:else if CUSTOM_LIST_KINDS.includes(note.kind)}
          <NoteContentKindList {note} />
        {:else}
          <NoteContentKind1 {note} {showEntire} {showMedia} {depth} expandable>
            <div slot="note-content" let:quote>
              <svelte:self depth={depth + 1} note={quote} />
            </div>
          </NoteContentKind1>
        {/if}
      </div>
      <div class="ml-14 pt-4">
        <NoteActions event={note} {children} />
      </div>
    {/if}
  </Card>
</div>
