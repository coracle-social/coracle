<script lang="ts">
  import type {Snippet} from "svelte"
  import {load} from "@welshman/net"
  import {NOTE} from "@welshman/util"
  import {fly} from "@lib/transition"
  import Spinner from "@lib/components/Spinner.svelte"
  import NoteItem from "@app/components/NoteItem.svelte"

  interface Props {
    url: string
    pubkey: string
    limit?: number
    fallback?: Snippet
  }

  const {url, pubkey, limit = 1, fallback}: Props = $props()

  const events = load({
    relays: [url],
    filters: [{authors: [pubkey], kinds: [NOTE], limit}],
  })
</script>

<div class="col-4">
  <div class="flex flex-col gap-2">
    {#await events}
      <p class="center my-12 flex">
        <Spinner loading />
      </p>
    {:then events}
      {#each events as event (event.id)}
        <div in:fly>
          <NoteItem {url} {event} />
        </div>
      {:else}
        {@render fallback?.()}
      {/each}
    {/await}
  </div>
</div>
