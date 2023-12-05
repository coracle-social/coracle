<script lang="ts">
  import {Tags} from "paravel"
  import {Naddr} from 'src/util/nostr'
  import Content from "src/partials/Content.svelte"
  import CurrencySymbol from "src/partials/CurrencySymbol.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import NoteContentTopics from "src/app/shared/NoteContentTopics.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import {router} from 'src/app/router'

  export let note
  export let showMedia = false

  const tags = Tags.from(note)
  const {title, summary, location} = tags.getDict()
  const [price, code] = tags.type("price").drop(1).first()

  const sendMessage = () => {
    const initialMessage = `Hi, I'd like to make an offer on this listing:\n${Naddr.fromEvent(note).encode()}`

    router.at('conversations').of(note.pubkey).cx({initialMessage}).push()
  }
</script>


<Content size="inherit">
  <div class="flex flex-col gap-2">
    <div class="flex gap-2 text-xl justify-between">
      <strong>{title}</strong>
      <span><CurrencySymbol {code} />{price}</span>
    </div>
    <p class="text-gray-3">{summary}</p>
    <div class="h-px bg-gray-6" />
    {#if location}
      <div class="flex items-center gap-2 text-sm text-gray-4">
        <i class="fa fa-location-dot" />
        {location}
      </div>
    {/if}
  </div>
  <NoteContentKind1 {note} {showMedia} />
  <NoteContentTopics {note} />
  <div class="flex justify-center">
    <Anchor theme="button-accent" on:click={sendMessage}>Make an offer</Anchor>
  </div>
</Content>
