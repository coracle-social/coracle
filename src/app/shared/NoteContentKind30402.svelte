<script lang="ts">
  import {Tags} from "paravel"
  import {commaFormat} from "hurdak"
  import {Naddr} from "src/util/nostr"
  import Content from "src/partials/Content.svelte"
  import Carousel from "src/partials/Carousel.svelte"
  import CurrencySymbol from "src/partials/CurrencySymbol.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"
  import NoteContentTopics from "src/app/shared/NoteContentTopics.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import {router} from "src/app/router"

  export let note
  export let showMedia = false
  export let showEntire = false

  const tags = Tags.from(note)
  const {title, summary, location} = tags.getDict()
  const images = tags.type("image").values().all()
  const [price = 0, code = "SAT"] = tags.type("price").drop(1).first() || []

  const sendMessage = () => {
    const initialMessage = `Hi, I'd like to make an offer on this listing:\n${Naddr.fromEvent(
      note,
    ).encode()}`

    router.at("conversations").of(note.pubkey).cx({initialMessage}).push()
  }
</script>

<Content size="inherit">
  <div class="flex flex-col gap-2">
    <div class="flex justify-between gap-2 text-xl">
      <strong>{title}</strong>
      <span class="whitespace-nowrap">
        <CurrencySymbol {code} />{commaFormat(price)}
        {code}
      </span>
    </div>
    {#if location}
      <div class="flex items-center gap-2 text-sm text-gray-4">
        <i class="fa fa-location-dot" />
        {location}
      </div>
    {/if}
    {#if summary !== note.content}
      <p class="text-gray-3">{summary}</p>
    {/if}
    <div class="h-px bg-gray-6" />
    <NoteContentKind1 {note} {showEntire} />
  </div>
  {#if showMedia}
    <Carousel urls={images} />
  {:else}
    <div class="flex flex-col">
      {#each images as url}
        <NoteContentLink value={{url, isMedia: true}} />
      {/each}
    </div>
  {/if}
  <NoteContentTopics {note} />
  <div class="flex justify-center">
    <Anchor theme="button-accent" on:click={sendMessage}>Make an offer</Anchor>
  </div>
</Content>
