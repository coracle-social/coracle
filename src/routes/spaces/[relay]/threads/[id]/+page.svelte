<script lang="ts">
  import {ctx, sortBy} from "@welshman/lib"
  import {page} from "$app/stores"
  import {pubkey, repository} from "@welshman/app"
  import {deriveEvents} from "@welshman/store"
  import {getReplyFilters} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import Content from "@app/components/Content.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import MenuSpace from "@app/components/MenuSpace.svelte"
  import Reactions from "@app/components/Reactions.svelte"
  import ThreadReply from "@app/components/ThreadReply.svelte"
  import {REPLY, deriveEvent, decodeRelay} from "@app/state"
  import {publishDelete, publishReaction} from "@app/commands"
  import {pushDrawer} from "@app/modal"

  const {relay, id} = $page.params
  const url = decodeRelay(relay)
  const event = deriveEvent(id)
  const replies = deriveEvents(repository, {filters: [{kinds: [REPLY], "#E": [id]}]})

  const back = () => history.back()

  const openMenu = () => pushDrawer(MenuSpace, {url})

  const getReactionHandler = (event: TrustedEvent) => (content: string, events: TrustedEvent[]) => {
    const reaction = events.find(e => e.pubkey === $pubkey)

    if (reaction) {
      publishDelete({relays: [url], event: reaction})
    } else {
      publishReaction({event, content, relays: [url]})
    }
  }
</script>

<div class="flex flex-col-reverse gap-2 max-h-screen overflow-auto p-2">
  {#each sortBy(e => -e.created_at, $replies) as reply (reply.id)}
    <NoteCard event={reply} class="w-full border-l border-b border-r border-solid border-neutral -mt-8 pt-12 p-6 rounded-box">
      <div class="ml-12">
        <Content event={reply} />
        <Reactions event={reply} onReactionClick={getReactionHandler(reply)} />
      </div>
    </NoteCard>
  {/each}
  <NoteCard event={$event} class="card2 bg-alt w-full py-2 z-feature relative border border-solid border-neutral">
    <div class="ml-12">
      <Content event={$event} />
      <Reactions event={$event} onReactionClick={getReactionHandler($event)} />
    </div>
  </NoteCard>
  <Button class="flex gap-2 mt-5 mb-3 items-center" on:click={back}>
    <Icon icon="alt-arrow-left" />
    Back to threads
  </Button>
</div>
<ThreadReply {url} event={$event} />
