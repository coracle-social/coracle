<script lang="ts">
  import {defaultTo} from "ramda"
  import {navigate} from "svelte-routing"
  import {nip19} from "nostr-tools"
  import {tryJson} from "src/util/misc"
  import {Tags} from "src/util/nostr"
  import Card from "src/partials/Card.svelte"
  import Content from "src/partials/Content.svelte"
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import {channels} from "src/engine"

  export let note

  const {name, picture, about} = tryJson(() => JSON.parse(note.content))
  const channel = channels
    .key(note.id)
    .derived(defaultTo({id: note.id, meta: {name, picture, about}}))
  const noteId = nip19.noteEncode(note.kind === 40 ? note.id : Tags.from(note).getMeta("e"))
</script>

<Card interactive invertColors on:click={() => navigate(`/chat/${noteId}`)}>
  <Content>
    <div class="flex items-center gap-2">
      {#if $channel.meta?.picture}
        <ImageCircle size={10} src={$channel.meta?.picture} />
      {/if}
      <h3 class="staatliches text-2xl">{$channel.meta?.name}</h3>
    </div>
    {#if $channel.meta?.about}
      <p>{$channel.meta?.about}</p>
    {/if}
  </Content>
</Card>
