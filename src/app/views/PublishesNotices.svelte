<script lang="ts">
  import {formatTimestamp, thunks, type Thunk} from "@welshman/app"
  import {ctx, identity, uniq} from "@welshman/lib"
  import {PublishStatus, type Connection} from "@welshman/net"
  import {get} from "svelte/store"
  import {fly} from "svelte/transition"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {fuzzy} from "src/util/misc"
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/util"
  import AltColor from "src/partials/AltColor.svelte"

  export let selected: string[] = []

  const searchConnections = fuzzy(Array.from(ctx.net.pool.data.keys()))

  function getNotices(connections: Connection[]) {
    return Object.values($thunks).filter(t =>
      connections.some(cxn => get(t.status)[cxn.url]?.status),
    )
  }

  function iconStatus(status: PublishStatus) {
    switch (status) {
      case PublishStatus.Success:
        return "fa fa-check-circle text-success"
      case PublishStatus.Pending:
        return "fa fa-clock"
      case PublishStatus.Failure:
        return "fa fa-times-circle text-danger"
      case PublishStatus.Timeout:
        return "fa fa-hourglass-half text-accent"
      case PublishStatus.Aborted:
        return "fa fa-ban"
    }
  }

  $: notices = getNotices(
    selected.map(url => ctx.net.pool.data.get(url)).filter(Boolean),
  ) as Thunk[]
</script>

<SearchSelect
  placeholder="Search notices by relay"
  multiple
  search={searchConnections}
  bind:value={selected}
  termToItem={identity}>
  <div slot="item" let:item>
    <strong>{item}</strong>
  </div>
</SearchSelect>

{#if !notices.length && selected.length}
  <div transition:fly|local={{y: 20}}>
    <AltColor background class="rounded-md p-6 shadow">
      <div class="place text-center text-neutral-100">No notices found for selected relays.</div>
    </AltColor>
  </div>
{:else}
  {#each notices as thunk}
    <AltColor background class="rounded-md p-6 shadow">
      <div class="flex justify-between">
        <span>Kind {thunk.event.kind}, published {formatTimestamp(thunk.event.created_at)}</span>
        <Anchor
          underline
          modal
          class="text-sm"
          on:click={() => router.at("notes").of(thunk.event.id).open()}>View Note</Anchor>
      </div>
      {#each uniq(Object.entries(get(thunk.status)).filter( ([k, v]) => selected.includes(k), )) as [url, status]}
        <div class="mt-4 flex items-center justify-between">
          <strong>{url}</strong>
          <div class="flex items-center gap-1">
            <i class={iconStatus(status.status)} />
            <span class="ml-2">{status.status}</span>
          </div>
        </div>
      {/each}
    </AltColor>
  {/each}
{/if}
