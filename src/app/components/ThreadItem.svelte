<script lang="ts">
  import {nthEq} from "@welshman/lib"
  import {formatTimestamp} from "@welshman/app"
  import Link from "@lib/components/Link.svelte"
  import Content from "@app/components/Content.svelte"
  import EventPostedBy from "@app/components/EventPostedBy.svelte"
  import ThreadActions from "@app/components/ThreadActions.svelte"
  import {makeThreadPath} from "@app/routes"

  interface Props {
    url: any
    event: any
    hideActions?: boolean
  }

  const {url, event, hideActions = false}: Props = $props()

  const title = event.tags.find(nthEq(0, "title"))?.[1]
</script>

<Link class="col-2 card2 bg-alt w-full cursor-pointer" href={makeThreadPath(url, event.id)}>
  {#if title}
    <div class="flex w-full items-center justify-between gap-2">
      <p class="text-xl">{title}</p>
      <p class="text-sm opacity-75">
        {formatTimestamp(event.created_at)}
      </p>
    </div>
  {:else}
    <p class="mb-3 h-0 text-xs opacity-75">
      {formatTimestamp(event.created_at)}
    </p>
  {/if}
  <Content {event} expandMode="inline" quoteProps={{relays: [url]}} />
  <div class="flex w-full flex-col items-end justify-between gap-2 sm:flex-row">
    <EventPostedBy {event} />
    {#if !hideActions}
      <ThreadActions showActivity {url} {event} />
    {/if}
  </div>
</Link>
