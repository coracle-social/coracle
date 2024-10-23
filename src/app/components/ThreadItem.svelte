<script lang="ts">
  import {max} from "@welshman/lib"
  import {formatTimestamp, formatTimestampRelative} from "@welshman/app"
  import {deriveEvents} from "@welshman/store"
  import {repository} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Content from "@app/components/Content.svelte"
  import Profile from "@app/components/Profile.svelte"
  import {makeThreadPath} from "@app/routes"
  import {REPLY} from "@app/state"

  export let url
  export let event

  const replies = deriveEvents(repository, {filters: [{kinds: [REPLY], "#E": [event.id]}]})

  $: lastActive = max([...$replies, event].map(e => e.created_at))
</script>

<Link class="col-2 card2 bg-alt w-full cursor-pointer" href={makeThreadPath(url, event.id)}>
  <div class="flex w-full justify-between gap-2">
    <Profile pubkey={event.pubkey} />
    <p class="text-sm opacity-75">
      {formatTimestamp(event.created_at)}
    </p>
  </div>
  <div class="col-4 w-full pl-12">
    <Content {event} />
    <div class="row-2 justify-end">
      <div class="flex-inline btn btn-neutral btn-xs gap-1 rounded-full">
        <Icon icon="reply" />
        <span>{$replies.length} {$replies.length === 1 ? "reply" : "replies"}</span>
      </div>
      <div class="btn btn-neutral btn-xs rounded-full">
        Active {formatTimestampRelative(lastActive)}
      </div>
    </div>
  </div>
</Link>
