<script lang="ts">
  import {nip19} from "nostr-tools"
  import {ctx} from "@welshman/lib"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Content from "@app/components/Content.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import {entityLink} from "@app/state"

  export let root
  export let replies

  const relays = ctx.app.router.Event(root).getUrls()
  const nevent = nip19.neventEncode({...root, relays})
</script>

<div class="flex flex-col items-end">
  <NoteCard event={root} class="card2 bg-alt w-full">
    <div class="ml-12">
      <Content event={root} />
    </div>
  </NoteCard>
  <Link
    href={entityLink(nevent)}
    class="btn btn-neutral -mt-6 mr-4 flex items-center gap-2 rounded-full z-feature">
    <Icon icon="chat-round" />
    <span>{replies.length}</span>
  </Link>
</div>
