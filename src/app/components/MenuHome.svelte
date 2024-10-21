<script lang="ts">
  import {pubkey} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import CardButton from "@lib/components/CardButton.svelte"
  import {makeChatPath} from "@app/routes"

  $: notesPath = makeChatPath([$pubkey!])
</script>

<div class="column menu gap-2">
  <Link href="/people">
    <CardButton>
      <div slot="icon"><Icon icon="user-heart" size={7} /></div>
      <div slot="title">People</div>
      <div slot="info">Search for people on the network</div>
    </CardButton>
  </Link>
  <Link href="/network">
    <CardButton>
      <div slot="icon"><Icon icon="share-circle" size={7} /></div>
      <div slot="title">Network</div>
      <div slot="info">Browse posts from your network</div>
    </CardButton>
  </Link>
  <Link href={notesPath}>
    <CardButton>
      <div slot="icon"><Icon icon="notes-minimalistic" size={7} /></div>
      <div slot="title">Notes</div>
      <div slot="info">Keep track of your notes</div>
    </CardButton>
  </Link>
  <Link href="/chats">
    <CardButton>
      <div slot="icon"><Icon icon="chat-round" size={7} /></div>
      <div slot="title">Chats</div>
      <div slot="info">Keep in touch with encrypted chat</div>
    </CardButton>
  </Link>
</div>
