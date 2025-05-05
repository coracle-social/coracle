<script lang="ts">
  import {nthEq, formatTimestamp} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import Link from "@lib/components/Link.svelte"
  import Content from "@app/components/Content.svelte"
  import ProfileLink from "@app/components/ProfileLink.svelte"
  import ThreadActions from "@app/components/ThreadActions.svelte"
  import {makeThreadPath} from "@app/routes"

  type Props = {
    url: string
    event: TrustedEvent
  }

  const {url, event}: Props = $props()

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
  <Content {event} {url} expandMode="inline" />
  <div class="flex w-full flex-col items-end justify-between gap-2 sm:flex-row">
    <span class="whitespace-nowrap py-1 text-sm opacity-75">
      Posted by <ProfileLink pubkey={event.pubkey} {url} />
    </span>
    <ThreadActions showActivity {url} {event} />
  </div>
</Link>
