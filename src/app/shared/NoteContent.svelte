<script lang="ts">
  import {objOf, reverse} from "ramda"
  import {fly} from "svelte/transition"
  import {splice, switcher, switcherFn} from "hurdak/lib/hurdak"
  import {warn} from "src/util/logger"
  import {displayPerson, parseContent, getLabelQuality, displayRelay, Tags} from "src/util/nostr"
  import {modal} from "src/partials/state"
  import MediaSet from "src/partials/MediaSet.svelte"
  import QRCode from "src/partials/QRCode.svelte"
  import Card from "src/partials/Card.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Rating from "src/partials/Rating.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {sampleRelays} from "src/agent/relays"
  import user from "src/agent/user"
  import network from "src/agent/network"
  import {getPersonWithFallback} from "src/agent/db"

  export let note
  export let anchorId = null
  export let maxLength = 700
  export let showEntire = false
  export let showMedia = user.getSetting("showMedia")

  const truncateAt = maxLength * 0.6
  const shouldTruncate = !showEntire && note.content.length > maxLength

  let content = parseContent(note)
  let rating = note.kind === 1985 ? getLabelQuality("review/relay", note) : null

  const links = []
  const invoices = []
  const ranges = []

  // Find links and preceding whitespace
  for (let i = 0; i < content.length; i++) {
    const {type, value} = content[i]

    if (type === "link") {
      links.push(value)
    }

    if (type === "lnurl") {
      invoices.push(value)
    }

    if (["link", "lnurl"].includes(type) && !value.startsWith("ws")) {
      const prev = content[i - 1]
      const next = content[i + 1]

      if ((!prev || prev.type === "newline") && (!next || next.type === "newline")) {
        let n = 1
        for (let j = i - 1; ; j--) {
          if (content[j]?.type === "newline") {
            n += 1
          } else {
            break
          }
        }

        ranges.push({i: i + 1, n})
      }
    }
  }

  // Remove links and preceding line breaks if they're on their own line
  if (showMedia) {
    for (const {i, n} of reverse(ranges)) {
      content = splice(i - n, n, content)
    }
  }

  // Truncate content if needed
  let l = 0
  if (shouldTruncate) {
    for (let i = 0; i < content.length; i++) {
      const prev = content[i - 1]

      // Avoid adding an ellipsis right after a newline
      if (l > truncateAt && prev?.type != "newline") {
        content = content.slice(0, i).concat({type: "text", value: "..."})

        break
      }

      if (typeof content[i].value === "string") {
        l += content[i].value.length
      }
    }
  }

  const isStandalone = i => {
    return (
      !content[i - 1] ||
      content[i - 1].type === "newline" ||
      !content[i + 1] ||
      content[i + 1].type === "newline"
    )
  }

  const loadQuote = async ({id, relays}) => {
    // Follow relay hints
    relays = (relays || []).map(objOf("url")).concat(Tags.from(note).equals(id).relays())

    try {
      const [event] = await network.load({
        relays: sampleRelays(relays),
        filter: [{ids: [id]}],
      })

      return event || Promise.reject()
    } catch (e) {
      warn(e)
    }
  }

  const openPerson = pubkey => modal.push({type: "person/feed", pubkey})

  const openQuote = id => {
    modal.push({type: "note/detail", note: {id}})
  }

  const openTopic = topic => {
    modal.push({type: "topic/feed", topic})
  }
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
    {#each content as { type, value }, i}
      {#if type === "newline" && i > 0}
        {#each value as _}
          <br />
        {/each}
      {:else if type === "topic"}
        <Anchor killEvent on:click={() => openTopic(value)}>#{value}</Anchor>
      {:else if type === "link"}
        <Anchor external href={value}>
          {value.replace(/https?:\/\/(www\.)?/, "")}
        </Anchor>
      {:else if type.startsWith("nostr:")}
        {#if showMedia && value.id && isStandalone(i) && value.id !== anchorId}
          <Card interactive invertColors class="my-2" on:click={() => openQuote(value.id)}>
            {#await loadQuote(value)}
              <Spinner />
            {:then quote}
              {@const person = getPersonWithFallback(quote.pubkey)}
              <div class="mb-4 flex items-center gap-4">
                <PersonCircle size={6} {person} />
                <Anchor
                  stopPropagation
                  type="unstyled"
                  class="flex items-center gap-2"
                  on:click={() => openPerson(quote.pubkey)}>
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
        {:else if type.match(/np(rofile|ub)$/)}
          @<Anchor killEvent on:click={() => openPerson(value.pubkey)}>
            {displayPerson(getPersonWithFallback(value.pubkey))}
          </Anchor>
        {:else}
          <Anchor killEvent href={"/" + value.entity}>
            {value.entity.slice(0, 16) + "..."}
          </Anchor>
        {/if}
      {:else}
        {value}
      {/if}
      {" "}
    {/each}
  </p>
  {#if invoices.length > 0}
    <div on:click|stopPropagation>
      <QRCode fullWidth onClick="copy" code={invoices[0]} />
    </div>
  {/if}
  {#if showMedia && links.length > 0}
    <div on:click|stopPropagation>
      <MediaSet {links} />
    </div>
  {/if}
</div>
