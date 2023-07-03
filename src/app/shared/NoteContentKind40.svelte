<script lang="ts">
  import {navigate} from "svelte-routing"
  import {nip19} from "nostr-tools"
  import {tryJson} from "src/util/misc"
  import Card from "src/partials/Card.svelte"
  import Content from "src/partials/Content.svelte"
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import {chat} from "src/system"
  import {watch} from "src/agent/db"

  export let note

  const {name, picture, about} = tryJson(() => JSON.parse(note.content))
  const channel = watch(chat.channels, t => t.get(note.id) || {id: note.id, name, picture, about})
  const noteId = nip19.noteEncode(note.id)
</script>

<Card interactive invertColors on:click={() => navigate(`/chat/${noteId}`)}>
  <Content>
    <div class="flex items-center gap-2">
      {#if $channel.picture}
        <ImageCircle size={10} src={$channel.picture} />
      {/if}
      <h3 class="staatliches text-2xl">{$channel.name}</h3>
    </div>
    {#if $channel.about}
      <p>{$channel.about}</p>
    {/if}
  </Content>
</Card>
