<script lang="ts">
  import {objOf} from "ramda"
  import {navigate} from "svelte-routing"
  import {fly} from "svelte/transition"
  import {first} from "hurdak/lib/hurdak"
  import {warn} from "src/util/logger"
  import {parseContent} from "src/util/html"
  import {displayPerson, Tags} from "src/util/nostr"
  import Carousel from "src/partials/Carousel.svelte"
  import Card from "src/partials/Card.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/partials/PersonCircle.svelte"
  import {sampleRelays} from "src/agent/relays"
  import user from "src/agent/user"
  import network from "src/agent/network"
  import {getPersonWithFallback} from "src/agent/tables"
  import {routes, modal} from "src/app/ui"

  export let note
  export let showEntire

  const links = []
  const entities = []
  const shouldTruncate = !showEntire && note.content.length > 500
  const content = parseContent(note.content)
  const showMedia = user.getSetting("showMedia")

  let l = 0
  for (let i = 0; i < content.length; i++) {
    const {type, value} = content[i]

    // Find links on their own line and remove them from content
    if (type === "link" || ["nostr:note", "nostr:nevent"].includes(type)) {
      const prev = content[i - 1]
      const next = content[i + 1]

      if (type === "link") {
        links.push(value)
      } else {
        entities.push({type, value})
      }

      // If the link is surrounded by line breaks (or content start/end), remove
      // the link along with trailing whitespace
      if (showMedia && (!prev || prev.type === "newline") && (!next || next.type === "newline")) {
        let n = 0

        for (let j = i + 1; j < content.length; j++) {
          if (content[j].type !== "newline") {
            break
          }

          n++
        }

        content.splice(i, n + 1)
        i = i - n
      }
    }

    // Keep track of total characters, if we're not dealing with a string just guess
    if (typeof value === 'string') {
      l += value.length

      if (shouldTruncate && l > 350 && type !== "newline") {
        content[i].value = value.trim()
        content.splice(i + 1, content.length, {type: "text", value: "..."})
        break
      }
    } else {
      l += 30
    }
  }

  const getMentionPubkey = text => {
    const i = parseInt(first(text.match(/\d+/)))

    // Some implementations count only p tags when calculating index, and some
    // implementations are 1-indexed
    if (note.tags[i]?.[0] === "p") {
      return note.tags[i][1]
    } else if (note.tags[i-1]?.[0] === "p") {
      return note.tags[i-1][1]
    } else {
      return Tags.from(note).type("p").values().nth(i)
    }
  }

  const loadQuote = async ({id, relays}) => {
    try {
      const [event] = await network.load({
        relays: sampleRelays((relays || []).map(objOf("url"))),
        filter: [{ids: [id]}],
      })

      return event || Promise.reject()
    } catch (e) {
      warn(e)
    }
  }

  const openQuote = id => {
    modal.set({type: "note/detail", note: {id}})
  }
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <p>
    {#each content as { type, value }}
      {#if type === "newline"}
        {#each value as _}
          <br />
        {/each}
      {:else if type === "link"}
        <Anchor external href={value}>
          {value.replace(/https?:\/\/(www\.)?/, "")}
        </Anchor>
      {:else if type.startsWith("nostr:")}
        <Anchor href={"/" + value.entity}>
          {#if value.pubkey}
            {displayPerson(getPersonWithFallback(value.pubkey))}
          {:else}
            {value.entity.slice(0, 10) + "..."}
          {/if}
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
  {#if showMedia && links.length > 0}
    <div on:click={e => e.stopPropagation()}>
      <Carousel {links} />
    </div>
  {/if}
  {#if entities.length > 0}
    <div class="py-2" on:click={e => e.stopPropagation()}>
      {#each entities as { value }}
        <Card interactive invertColors on:click={() => openQuote(value.id)}>
          {#await loadQuote(value)}
            <Spinner />
          {:then quote}
            {@const person = getPersonWithFallback(quote.pubkey)}
            <div class="mb-4 flex items-center gap-4">
              <PersonCircle size={6} {person} />
              <Anchor
                type="unstyled"
                class="flex items-center gap-2"
                on:click={() => navigate(routes.person(quote.pubkey))}>
                <h2 class="text-lg">{displayPerson(person)}</h2>
              </Anchor>
            </div>
            <svelte:self note={quote} />
          {:catch}
            <p class="mb-1 py-24 text-center text-gray-5" in:fly={{y: 20}}>
              Unable to load a preview for quoted event
            </p>
          {/await}
        </Card>
      {/each}
    </div>
  {/if}
</div>
