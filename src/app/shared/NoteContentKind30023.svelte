<script lang="ts">
  import insane from "insane"
  import {marked} from "marked"
  import {onMount} from "svelte"
  import {nip19} from "nostr-tools"
  import {fromPairs} from "ramda"
  import {switcherFn} from "hurdak"
  import {urlIsMedia} from "@welshman/content"
  import {fromNostrURI, Tags} from "@welshman/util"
  import {displayProfileByPubkey} from "@welshman/app"
  import {warn} from "src/util/logger"
  import Chip from "src/partials/Chip.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"
  import {router} from "src/app/util/router"

  export let note, showEntire
  export let showMedia = false

  let content
  const regex = /(nostr:)?n(event|ote|pub|profile|addr)\w{10,1000}/g
  const {title, summary, image, alt} = fromPairs(note.tags) as Record<string, string>

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
        npub: () => "@" + displayProfileByPubkey(data),
        nprofile: () => "@" + displayProfileByPubkey(data.pubkey),
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

            router.at(entity).open()
          })
        }
      })
    }
  })
</script>

<div class="flex flex-col gap-4 overflow-hidden text-ellipsis">
  <h3 class="staatliches text-2xl">{title}</h3>
  {#if (summary || alt) && (!showEntire || !note.content)}
    <p>{summary || alt}</p>
  {/if}
  {#if showMedia && image && urlIsMedia(image)}
    <NoteContentLink value={{url: image, isMedia: true}} showMedia />
  {/if}
  <div>
    {#each Tags.fromEvent(note).topics().valueOf() as topic}
      <Anchor modal href={router.at("topics").of(topic).toString()}>
        <Chip class="mb-2 mr-2 inline-block cursor-pointer">#{topic}</Chip>
      </Anchor>
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
