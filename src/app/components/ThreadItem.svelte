<script lang="ts">
  import {nip19} from "nostr-tools"
  import {ctx} from "@welshman/lib"
  import {repository} from "@welshman/app"
  import {getReplyFilters} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Content from "@app/components/Content.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import {entityLink} from "@app/state"

  export let event

  const replies = deriveEvents(repository, {filters: getReplyFilters([event])})
  const relays = ctx.app.router.Event(event).getUrls()
  const nevent = nip19.neventEncode({...event, relays})
</script>

<div class="flex flex-col items-end">
  <NoteCard {event} class="card2 bg-alt w-full">
    <div class="ml-12">
      <Content {event} />
    </div>
  </NoteCard>
  <Link
    href={entityLink(nevent)}
    class="btn btn-neutral z-feature -mt-6 mr-4 flex items-center gap-2 rounded-full">
    <Icon icon="chat-round" />
    <span>{$replies.length}</span>
  </Link>
</div>
