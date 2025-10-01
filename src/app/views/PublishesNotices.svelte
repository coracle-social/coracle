<script lang="ts">
  import {formatTimestamp} from "@welshman/lib"
  import {thunks, createSearch, isThunk} from "@welshman/app"
  import {fly} from "svelte/transition"
  import AltColor from "src/partials/AltColor.svelte"
  import Input from "src/partials/Input.svelte"
  import ThunkNotice from "src/partials/ThunkNotice.svelte"
  import {subscriptionNotices} from "src/domain/connection"

  export let search: string = ""

  $: subNotices = Array.from($subscriptionNotices.values()).flatMap(n => n)

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

  $: pubNotices = Object.values($thunks).flatMap(thunk => {
    if (!isThunk(thunk)) return []

    return Object.entries(thunk.results).map(([url, {status, detail}]) => ({
      url,
      status,
      message: detail,
      eventId: thunk.event.id,
      created_at: thunk.event.created_at,
      eventKind: "Kind" + thunk.event.kind,
    }))
  })

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
          {#each notice.notice.slice(1).filter(n => typeof n === "string") as item}
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
