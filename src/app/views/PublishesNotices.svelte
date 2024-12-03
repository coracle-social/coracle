<script lang="ts">
  import {formatTimestamp, thunks, type Thunk, type ThunkStatus} from "@welshman/app"
  import {ctx, identity, uniq} from "@welshman/lib"
  import {PublishStatus, type Connection} from "@welshman/net"
  import {get} from "svelte/store"
  import {fly} from "svelte/transition"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import AltColor from "src/partials/AltColor.svelte"
  import {fuzzy} from "src/util/misc"
  import {router} from "src/app/util"
  import {subscriptionNotices, type SubscriptionNotice} from "src/engine"

  export let selected: string[] = []

  $: subNotices = selected.flatMap(s => $subscriptionNotices.get(s)?.map(n => ({...n, url: s})))

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
  // for subscription notices
  function colorFromVerb(verb: string) {
    switch (verb) {
      case "OK":
        return "text-success"
      case "EOSE":
        return "text-neutral-100"
      case "NOTICE":
        return "text-accent"
      case "CLOSED":
        return "text-danger"
      case "NEG-MSG":
        return "text-accent"
    }
  }

  $: pubNotices = getPubNotices(
    selected.map(url => ctx.net.pool.data.get(url)).filter(Boolean),
  ) as Thunk[]

  $: notices = ([...pubNotices, ...subNotices] as (Thunk & (SubscriptionNotice & {url: string}))[])
    .sort((a, b) => {
      return a.created_at - b.created_at
    })
    .filter(Boolean)
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

{#if !selected.length}
  <div transition:fly|local={{y: 20}}>
    <AltColor background class="rounded-md p-6 shadow">
      <div class="place text-center text-neutral-100">No relay selected.</div>
    </AltColor>
  </div>
{:else if !notices.length && selected.length}
  <div transition:fly|local={{y: 20}}>
    <AltColor background class="rounded-md p-6 shadow">
      <div class="place text-center text-neutral-100">No notices found for selected relays.</div>
    </AltColor>
  </div>
{:else}
  <AltColor background class="rounded-md p-2">
    {#each notices as notice (JSON.stringify(notice))}
      <div>
        {#if notice.event}
          {#each uniq(Object.entries(get(notice.status)).filter( ([k, v]) => selected.includes(k), )) as [url, status] (url)}
            {@const {message, color} = messageAndColorFromStatus(get(notice.status)[url])}
            <div
              class="flex gap-2 p-2"
              on:click={() => router.at("notes").of(notice.event.id).open()}>
              <span class="shrink-0 text-neutral-400"
                >{formatTimestamp(notice.event.created_at)}</span>
              <strong class={color}>to {url}:</strong>
              <span class="shrink-0">[Kind {notice.event.kind}]</span>
              <span class="">{message}</span>
            </div>
          {/each}
        {:else}
          <div class="flex flex-wrap items-center gap-2 overflow-hidden p-2">
            <span class="shrink-0 text-neutral-400">{formatTimestamp(notice.created_at)}</span>
            <strong class={colorFromVerb(notice.notice[0])}>from {notice.url}</strong>
            <span class="shrink-0">[{notice.notice[0]}]</span>
            {#each notice.notice.slice(1).filter(n => typeof n == "string") as item}
              <span class="text-neutral-300">{item}</span>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </AltColor>
{/if}
