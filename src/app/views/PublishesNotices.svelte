<script lang="ts">
  import {formatTimestamp, thunks, type Thunk, type ThunkStatus} from "@welshman/app"
  import {ctx, identity, uniq} from "@welshman/lib"
  import {PublishStatus, ConnectionEvent, type Connection} from "@welshman/net"
  import cx from "classnames"
  import {get} from "svelte/store"
  import {fly} from "svelte/transition"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import AltColor from "src/partials/AltColor.svelte"
  import {fuzzy} from "src/util/misc"
  import {router} from "src/app/util"
  import {now} from "@welshman/signer"
  import {onDestroy} from "svelte"

  export let selected: string[] = []

  type SubNotice = {received_at: number; notice: string}

  const subNotices: SubNotice[] = []

  const noticeListener = (notice: string) => {
    subNotices.push({received_at: now(), notice})
  }

  $: selected
    .map(url => ctx.net.pool.data.get(url))
    .filter(Boolean)
    .forEach(cxn => {
      cxn.off(ConnectionEvent.Notice, noticeListener)
      cxn.on(ConnectionEvent.Notice, noticeListener)
    })

  const searchConnections = fuzzy(Array.from(ctx.net.pool.data.keys()))

  function getPubNotices(connections: Connection[]) {
    return Object.values($thunks).filter(t =>
      connections.some(cxn => get(t.status)[cxn.url]?.status),
    )
  }

  function messageAndColorFromStatus(status: ThunkStatus) {
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

  $: pubNotices = getPubNotices(
    selected.map(url => ctx.net.pool.data.get(url)).filter(Boolean),
  ) as Thunk[]

  $: notices = ([...pubNotices, ...subNotices] as (Thunk & SubNotice)[]).sort((a, b) => {
    const aDate = a?.event ? a?.event.created_at : a?.received_at
    const bDate = b?.event ? b?.event.created_at : b?.received_at
    return bDate - aDate
  })

  onDestroy(() => {
    selected
      .map(url => ctx.net.pool.data.get(url))
      .filter(Boolean)
      .forEach(cxn => {
        cxn.off(ConnectionEvent.Notice, noticeListener)
      })
  })
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
  {#each notices as notice}
    {#if notice.event}
      <AltColor
        background
        class="rounded-md p-6 shadow"
        on:click={() => router.at("notes").of(notice.event.id).open()}>
        <div class="flex items-center gap-2">
          <span class="text-neutral-400">{formatTimestamp(notice.event.created_at)}</span>
          <span>[Kind {notice.event.kind}]</span>
          {#each uniq(Object.entries(get(notice.status)).filter( ([k, v]) => selected.includes(k), )) as [url, status]}
            {@const {message, color} = messageAndColorFromStatus(get(notice.status)[url])}
            <div class="flex items-center justify-between gap-2">
              to <strong>{url}:</strong>
              <div class={cx(color, "flex items-center gap-1")}>
                <span class="">{message}</span>
              </div>
            </div>
          {/each}
        </div>
      </AltColor>
    {:else}
      <AltColor background class="rounded-md p-6 shadow">
        <div class="flex items-center gap-2">
          <span class="text-neutral-400">{formatTimestamp(notice.received_at)}</span>
          <span>[Notice]</span>
          <div class="flex items-center gap-1">
            <span class="text-neutral-100">{notice.notice}</span>
          </div>
        </div>
      </AltColor>
    {/if}
  {/each}
{/if}
