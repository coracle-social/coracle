<script lang="ts">
  import insane from "insane"
  import {marked} from "marked"
  import {onMount} from "svelte"
  import * as nip19 from "nostr-tools/nip19"
  import {fromPairs} from "@welshman/lib"
  import {fromNostrURI, getTopicTagValues} from "@welshman/util"
  import {displayProfileByPubkey} from "@welshman/app"
  import {warn} from "src/util/logger"
  import Chip from "src/partials/Chip.svelte"
  import Link from "src/partials/Link.svelte"
  import NoteContentLinks from "src/app/shared/NoteContentLinks.svelte"
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

      let display = entity.slice(0, 16) + "..."
      if (type === "npub") {
        display = "@" + displayProfileByPubkey(data)
      } else if (type === "nprofile") {
        display = "@" + displayProfileByPubkey(data.pubkey)
      }

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
  <h3 class="text-2xl">{title}</h3>
  {#if summary || alt}
    <p>{summary || alt}</p>
  {/if}
  {#if showMedia && image}
    <NoteContentLinks urls={[image]} showMedia />
  {/if}
  <div>
    {#each getTopicTagValues(note.tags) as topic}
      <Link modal href={router.at("topics").of(topic).toString()}>
        <Chip class="mb-2 mr-2 inline-block cursor-pointer">#{topic}</Chip>
      </Link>
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
