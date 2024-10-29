<script lang="ts">
  import {nthEq} from '@welshman/lib'
  import {formatTimestamp} from "@welshman/app"
  import Link from "@lib/components/Link.svelte"
  import Content from "@app/components/Content.svelte"
  import ProfileName from "@app/components/ProfileName.svelte"
  import ThreadActions from "@app/components/ThreadActions.svelte"
  import {makeThreadPath} from "@app/routes"
  import {pubkeyLink} from "@app/state"

  export let url
  export let event
  export let hideActions = false

  const title = event.tags.find(nthEq(0, 'title'))?.[1]
</script>

<Link class="col-2 card2 bg-alt w-full cursor-pointer" href={makeThreadPath(url, event.id)}>
  <div class="flex w-full justify-between items-center gap-2">
    <p class="text-xl">{title}</p>
    <p class="text-sm opacity-75">
      {formatTimestamp(event.created_at)}
    </p>
  </div>
  <Content {event} expandMode="inline" />
  <div class="flex gap-2 items-end justify-between w-full">
    <span class="text-sm opacity-75 whitespace-nowrap py-1">
      Posted by
      <Link external href={pubkeyLink(event.pubkey)} class="link-content">
        @<ProfileName pubkey={event.pubkey} />
      </Link>
    </span>
    {#if !hideActions}
      <ThreadActions showActivity {url} {event} />
    {/if}
  </div>
</Link>
