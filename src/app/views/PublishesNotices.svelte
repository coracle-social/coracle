<script lang="ts">
  import {formatTimestamp, thunks, type Thunk, type ThunkStatus} from "@welshman/app"
  import {ctx, identity, uniq} from "@welshman/lib"
  import {PublishStatus, type Connection} from "@welshman/net"
  import cx from "classnames"
  import {get} from "svelte/store"
  import {fly} from "svelte/transition"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import AltColor from "src/partials/AltColor.svelte"
  import {fuzzy} from "src/util/misc"
  import {router} from "src/app/util"

  export let selected: string[] = []

  const searchConnections = fuzzy(Array.from(ctx.net.pool.data.keys()))

  function getNotices(connections: Connection[]) {
    return Object.values($thunks).filter(t =>
      connections.some(cxn => get(t.status)[cxn.url]?.status),
    )
  }

  function messageAndColorFromStatus(status: ThunkStatus) {
    console.log("message", status)
    switch (status.status) {
      case PublishStatus.Success:
        return {message: status.message || "Published", color: "text-success"}
      case PublishStatus.Pending:
        return {message: status.message || "Pending", color: "text-warning"}
      case PublishStatus.Failure:
        return {message: status.message || "Failed", color: "text-danger"}
      case PublishStatus.Timeout:
        return {message: status.message || "Timed out", color: "text-accent"}
      case PublishStatus.Aborted:
        return {message: status.message || "Aborted", color: "text-accent"}
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
    <AltColor
      background
      class="rounded-md p-6 shadow"
      on:click={() => router.at("notes").of(thunk.event.id).open()}>
      <div class="flex items-center gap-2">
        <span class="text-neutral-400">{formatTimestamp(thunk.event.created_at)}</span>
        <span>[Kind {thunk.event.kind}]</span>
        {#each uniq(Object.entries(get(thunk.status)).filter( ([k, v]) => selected.includes(k), )) as [url, status]}
          {@const {message, color} = messageAndColorFromStatus(get(thunk.status)[url])}
          <div class="flex items-center justify-between gap-2">
            to <strong>{url}:</strong>
            <div class={cx(color, "flex items-center gap-1")}>
              <span class="">{message}</span>
            </div>
          </div>
        {/each}
      </div>
    </AltColor>
  {/each}
{/if}
