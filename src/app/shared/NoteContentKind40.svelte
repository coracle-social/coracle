<script lang="ts">
  import {Tags} from "paravel"
  import {nip19} from "nostr-tools"
  import {tryJson} from "src/util/misc"
  import Card from "src/partials/Card.svelte"
  import Content from "src/partials/Content.svelte"
  import ImageCircle from "src/partials/ImageCircle.svelte"

  export let note

  const {name, picture, about} = tryJson(() => JSON.parse(note.content))
  const noteId = nip19.noteEncode(note.kind === 40 ? note.id : Tags.from(note).getValue("e"))

  const goToChat = () => window.open(`https://chat.coracle.social/chat/${noteId}`)
</script>

<Card interactive on:click={goToChat}>
  <Content>
    <div class="flex items-center gap-2">
      {#if picture}
        <ImageCircle class="h-10 w-10" src={picture} />
      {/if}
      <h3 class="staatliches text-2xl">{name}</h3>
    </div>
    {#if about}
      <p>{about}</p>
    {/if}
  </Content>
</Card>
