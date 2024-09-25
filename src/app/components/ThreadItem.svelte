<script lang="ts">
  import {nip19} from 'nostr-tools'
  import {ctx} from '@welshman/lib'
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Content from "@app/components/Content.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import {entityLink} from '@app/state'

  export let root
  export let replies

  const relays = ctx.app.router.Event(root).getUrls()
  const nevent = nip19.neventEncode({...root, relays})
</script>

<div class="flex flex-col items-end">
  <NoteCard event={root} class="card2 w-full">
    <div class="ml-12">
      <Content event={root} />
    </div>
  </NoteCard>
  <Link
    href={entityLink(nevent)}
    class="flex items-center gap-2 btn btn-neutral -mt-6 mr-4 rounded-full">
    <Icon icon="chat-round" />
    <span>{replies.length}</span>
  </Link>
</div>
