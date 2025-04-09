<script lang="ts">
  import {getTagValue} from "@welshman/util"
  import * as nip19 from "nostr-tools/nip19"
  import {parseJson} from "src/util/misc"
  import Card from "src/partials/Card.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import ImageCircle from "src/partials/ImageCircle.svelte"

  export let note

  const {name, picture, about} = parseJson(note.content)
  const noteId = nip19.noteEncode(note.kind === 40 ? note.id : getTagValue("e", note.tags))

  const goToChat = () => window.open(`https://chat.coracle.social/chat/${noteId}`)
</script>

<Card interactive on:click={goToChat}>
  <FlexColumn>
    <div class="flex items-center gap-2">
      {#if picture}
        <ImageCircle class="h-10 w-10" src={picture} />
      {/if}
      <h3 class="staatliches text-2xl">{name}</h3>
    </div>
    {#if about}
      <p>{about}</p>
    {/if}
  </FlexColumn>
</Card>
