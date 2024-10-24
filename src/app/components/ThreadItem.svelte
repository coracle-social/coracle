<script lang="ts">
  import {formatTimestamp} from "@welshman/app"
  import Link from "@lib/components/Link.svelte"
  import Content from "@app/components/Content.svelte"
  import Profile from "@app/components/Profile.svelte"
  import ThreadActions from "@app/components/ThreadActions.svelte"
  import {makeThreadPath} from "@app/routes"

  export let url
  export let event
  export let hideActions = false
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
    {#if !hideActions}
      <ThreadActions showActivity {url} {event} />
    {/if}
  </div>
</Link>
