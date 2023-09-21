<script lang="ts">
  import insane from "insane"
  import {marked} from "marked"
  import {onMount} from "svelte"
  import {nip19} from "nostr-tools"
  import {switcherFn} from "hurdak"
  import {warn} from "src/util/logger"
  import {Tags, fromNostrURI} from "src/util/nostr"
  import {urlIsMedia} from "src/util/notes"
  import {modal} from "src/partials/state"
  import Chip from "src/partials/Chip.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"
  import {displayPubkey} from "src/engine"

  marked.use({
    mangle: false,
    headerIds: false,
    headerPrefix: false,
  })

  export let note, showEntire
  export let showMedia = false

  let content
  const tags = Tags.from(note)
  const regex = /(nostr:)?n(event|ote|pub|profile|addr)\w+/g
  const {title, summary, image} = tags.asMeta() as {[k: string]: string}

  const openTopic = topic => {
    modal.push({type: "topic/feed", topic})
  }

  const convertEntities = markdown => {
    for (const uri of markdown.match(regex) || []) {
      const entity = fromNostrURI(uri)

      let type, data

      try {
        ;({type, data} = nip19.decode(entity) as {type: string; data: any})
      } catch (e) {
        warn(e)
      }

      const display = switcherFn(type, {
        npub: () => "@" + displayPubkey(data),
        nprofile: () => "@" + displayPubkey(data.pubkey),
        default: () => entity.slice(0, 16) + "...",
      })

      markdown = markdown.replace(uri, `[${display}](${entity})`)
    }

    return markdown
  }

  onMount(() => {
    if (content) {
      ;[...content.querySelectorAll("a")].forEach(a => {
        const [entity] = a.href.match(regex) || []

        if (entity) {
          a.addEventListener("click", e => {
            e.preventDefault()

            modal.push({type: "bech32", entity})
          })
        }
      })
    }
  })
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <h3 class="staatliches text-2xl">{title}</h3>
  {#if summary && !showEntire}
    <p>{summary}</p>
  {/if}
  {#if showMedia && image && urlIsMedia(image)}
    <NoteContentLink value={{url: image, isMedia: true}} showMedia />
  {/if}
  <div>
    {#each tags.topics() as topic}
      <Chip class="mb-2 mr-2 inline-block cursor-pointer" on:click={() => openTopic(topic)}>
        #{topic}
      </Chip>
    {/each}
  </div>
</div>

{#if showEntire}
  <div
    bind:this={content}
    class="long-form-content flex flex-col gap-4 overflow-hidden text-ellipsis leading-6">
    {@html insane(marked.parse(convertEntities(note.content)))}
  </div>
{/if}
