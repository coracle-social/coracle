<script lang="ts">
  import insane from "insane"
  import {marked} from "marked"
  import {onMount} from "svelte"
  import * as nip19 from "nostr-tools/nip19"
  import {fromNostrURI, tagSpec, tagValue} from "@welshman/util"
  import {Article} from "@welshman/domain"
  import {profiles, reader} from "src/engine/core"
  import {warn} from "src/util/logger"
  import Chip from "src/partials/Chip.svelte"
  import NoteContentLinks from "src/app/shared/NoteContentLinks.svelte"
  import NoteContentTopic from "src/app/shared/NoteContentTopic.svelte"
  import {router} from "src/app/util/router"

  export let note, showEntire
  export let showMedia = false

  let content
  const regex = /(nostr:)?n(event|ote|pub|profile|addr)\w{10,1000}/g
  const article = reader(Article)(note)
  // ArticleReader doesn't model nip 31's alt tag, which coracle falls back to for a summary
  const alt = tagValue(tagSpec("alt"), note.tags)

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
        display = "@" + profiles.get().display(data).get()
      } else if (type === "nprofile") {
        display = "@" + profiles.get().display(data.pubkey).get()
      }

      markdown = markdown.replace(uri, `[${display}](${entity})`)
    }

    return markdown
  }

  const onClick = event => {
    if (event.target.tagName === "IMG") {
      const url = event.target.getAttribute("src")

      if (event.metaKey) {
        return window.open(url, "_blank")
      }

      router.at("media").of(url).open({overlay: true})
    }
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
  <h3 class="text-2xl">{article.title()}</h3>
  {#if article.summary() || alt}
    <p>{article.summary() || alt}</p>
  {/if}
  {#if showMedia && article.image()}
    <NoteContentLinks urls={[article.image()]} showMedia />
  {/if}
  <div>
    {#each article.topics() as topic}
      <NoteContentTopic value={topic}>
        <Chip class="mb-2 mr-2 inline-block cursor-pointer">#{topic}</Chip>
      </NoteContentTopic>
    {/each}
  </div>
</div>

{#if showEntire}
  <div
    bind:this={content}
    on:click|stopPropagation={onClick}
    class="long-form-content flex flex-col gap-4 overflow-hidden text-ellipsis leading-6">
    {@html insane(marked.parse(convertEntities(note.content)))}
  </div>
{/if}
