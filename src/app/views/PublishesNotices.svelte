<script lang="ts">
  import {formatTimestamp, thunks, createSearch, type Thunk} from "@welshman/app"
  import {ctx} from "@welshman/lib"
  import {type Connection} from "@welshman/net"
  import {get} from "svelte/store"
  import {fly} from "svelte/transition"
  import AltColor from "src/partials/AltColor.svelte"
  import Input from "src/partials/Input.svelte"
  import ThunkNotice from "src/partials/ThunkNotice.svelte"
  import {
    messageAndColorFromStatus,
    subscriptionNotices,
    type PublishNotice,
  } from "src/domain/connection"

  export let search: string = ""

  $: subNotices = Array.from($subscriptionNotices.values()).flatMap(n => n)

  function getPubNotices(connections: Connection[]) {
    return Object.values($thunks).filter(
      t => connections.some(cxn => get(t.status)[cxn.url]?.status) && "event" in t,
    ) as Thunk[]
  }

  // for subscription notices
  function colorFromVerb(verb: string) {
    switch (verb) {
      case "OK":
        return "text-success"
      case "NOTICE":
        return "text-accent"
      case "CLOSED":
        return "text-danger"
    }
  }

  $: pubNotices = getPubNotices(Array.from(ctx.net.pool.data.values())).flatMap(p =>
    Object.keys(get(p.status))
      .filter(k => k.includes(search) || get(p.status)[k].message.includes(search))
      .map(k => ({
        eventId: p.event.id,
        created_at: p.event.created_at,
        eventKind: "Kind" + p.event.kind,
        url: k,
        message: messageAndColorFromStatus(get(p.status)[k]).message,
        status: get(p.status)[k],
      })),
  ) as PublishNotice[]

  $: noticesSearch = createSearch([...pubNotices, ...subNotices], {
    getValue: notice => notice.url,
    fuseOptions: {
      keys: ["url", "message", "eventKind", "notice"],
      shouldSort: false,
      threshold: 0.2,
    },
  })
</script>

<Input placeholder="Search notices" type="search" bind:value={search} />

<AltColor background class="rounded-md p-2">
  {#each noticesSearch.searchOptions(search) as notice}
    <div>
      {#if "eventId" in notice}
        <ThunkNotice {notice} />
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
  {:else}
    <div in:fly|local={{y: 20}} class="rounded-md p-6 shadow">
      <div class="place text-center text-neutral-100">No notices found.</div>
    </div>
  {/each}
</AltColor>
