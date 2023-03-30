<script lang="ts">
  import {first} from "hurdak/lib/hurdak"
  import {parseContent} from "src/util/html"
  import {displayPerson, Tags} from "src/util/nostr"
  import Carousel from "src/partials/Carousel.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import user from "src/agent/user"
  import {getPersonWithFallback} from "src/agent/tables"
  import {routes} from "src/app/ui"

  export let note
  export let showEntire

  const links = []
  const shouldTruncate = !showEntire && note.content.length > 800
  const content = parseContent(note.content)

  let l = 0
  for (let i = 0; i < content.length; i++) {
    const {type, value} = content[i]

    // Find links on their own line and remove them from content
    if (type === "link") {
      const prev = content[i - 1]
      const next = content[i + 1]

      links.push(value)

      if ((!prev || prev.type === "br") && (!next || next.type === "br")) {
        let n = 1

        for (let j = i + 1; j < content.length; j++) {
          if (content[j].type !== "br") {
            break
          }

          n++
        }

        content.splice(i, n)
      }
    }

    l += value.length

    if (shouldTruncate && l > 400 && type !== "br") {
      content[i].value = value.trim()
      content.splice(i + 1, content.length, {type: "text", value: "..."})
      break
    }
  }

  const getMentionPubkey = text => {
    const i = parseInt(first(text.match(/\d+/)))

    console.log(note.tags, i)
    // Some implementations count only p tags when calculating index
    if (note.tags[i]?.[0] === "p") {
      return note.tags[i][1]
    } else {
      return Tags.from(note).type("p").values().nth(i)
    }
  }
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <p>
    {#each content as { type, value }}
      {#if type === "br"}
        {@html value}
      {:else if type === "link"}
        <Anchor external href={value}>
          {value.replace(/https?:\/\/(www\.)?/, "")}
        </Anchor>
      {:else if type === "mention"}
        {@const pubkey = getMentionPubkey(value)}
        {#if pubkey}
          @<Anchor href={routes.person(pubkey)}>
            {displayPerson(getPersonWithFallback(pubkey))}
          </Anchor>
        {:else}
          {value}
        {/if}
      {:else}
        {value}
      {/if}
    {/each}
  </p>
  {#if user.getSetting("showMedia") && links.length > 0}
    <button class="inline-block" on:click={e => e.stopPropagation()}>
      <Carousel {links} />
    </button>
  {/if}
</div>
