<script lang="ts">
  import {pluck, without} from "ramda"
  import {switcher, switcherFn} from "hurdak/lib/hurdak"
  import {displayPerson, getLabelQuality, displayRelay, Tags} from "src/util/nostr"
  import {parseContent, truncateContent, LINK, INVOICE, NEWLINE, TOPIC} from "src/util/notes"
  import {modal} from "src/partials/state"
  import MediaSet from "src/partials/MediaSet.svelte"
  import QRCode from "src/partials/QRCode.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Rating from "src/partials/Rating.svelte"
  import NoteContentNewline from "src/app/shared/NoteContentNewline.svelte"
  import NoteContentTopic from "src/app/shared/NoteContentTopic.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"
  import NoteContentPerson from "src/app/shared/NoteContentPerson.svelte"
  import NoteContentQuote from "src/app/shared/NoteContentQuote.svelte"
  import NoteContentEntity from "src/app/shared/NoteContentEntity.svelte"
  import user from "src/agent/user"
  import {getPersonWithFallback} from "src/agent/db"

  export let note
  export let anchorId = null
  export let maxLength = 700
  export let showEntire = false
  export let showMedia = user.getSetting("showMedia")

  const getLinks = parts =>
    pluck(
      "value",
      parts.filter(x => x.type === LINK && x.canDisplay)
    )

  const isStandalone = i => {
    return (
      !shortContent[i - 1] ||
      shortContent[i - 1].type === NEWLINE ||
      !shortContent[i + 1] ||
      shortContent[i + 1].type === NEWLINE
    )
  }

  const fullContent = parseContent(note)
  const shortContent = truncateContent(fullContent, {maxLength, showEntire, showMedia})
  const rating = note.kind === 1985 ? getLabelQuality("review/relay", note) : null
  const links = getLinks(shortContent)
  const extraLinks = without(links, getLinks(fullContent))
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <p>
    {#if rating}
      {@const [type, value] = Tags.from(note)
        .reject(t => ["l", "L"].includes(t[0]))
        .first()}
      {@const action = switcher(type, {
        r: () => modal.push({type: "relay/detail", url: value}),
        p: () => modal.push({type: "person/feed", pubkey: value}),
        e: () => modal.push({type: "note/detail", note: {id: value}}),
      })}
      {@const display = switcherFn(type, {
        r: () => displayRelay({url: value}),
        p: () => displayPerson(getPersonWithFallback(value)),
        e: () => "a note",
        default: "something",
      })}
      <div class="mb-4 flex items-center gap-2 border-l-2 border-solid border-gray-5 pl-2">
        Rated
        {#if action}
          <Anchor on:click={action}>{display}</Anchor>
        {:else}
          {display}
        {/if}
        <div class="text-sm">
          <Rating inert value={rating} />
        </div>
      </div>
    {/if}
    {#each shortContent as { type, value }, i}
      {#if type === NEWLINE}
        <NoteContentNewline {value} />
      {:else if type === TOPIC}
        <NoteContentTopic {value} />
      {:else if type === INVOICE}
        <div on:click|stopPropagation>
          <QRCode fullWidth onClick="copy" code={value} />
        </div>
      {:else if type === LINK}
        <NoteContentLink {value} showMedia={showMedia && isStandalone(i)} />
      {:else if type.match(/^nostr:np(rofile|ub)$/)}
        <NoteContentPerson {value} />
      {:else if type.startsWith("nostr:") && showMedia && isStandalone(i) && value.id !== anchorId}
        <NoteContentQuote {note} {value}>
          <div slot="note-content" let:quote>
            <svelte:self note={quote} />
          </div>
        </NoteContentQuote>
      {:else if type.startsWith("nostr:")}
        <NoteContentEntity {value} />
      {:else}
        {value}
      {/if}
      {" "}
    {/each}
  </p>
  {#if showMedia && extraLinks.length > 0}
    <MediaSet links={extraLinks} />
  {/if}
</div>
