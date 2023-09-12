<script lang="ts">
  import {pluck} from "ramda"
  import type {Event} from "src/engine2"
  import Content from "src/partials/Content.svelte"
  import NotificationSection from "src/app/views/NotificationSection.svelte"

  export let zaps: Event[]
  export let likes: Event[]
  export let replies: Event[]
</script>

<Content>
  {#if zaps.length > 0}
    <NotificationSection label="Zapped by" pubkeys={pluck("pubkey", zaps)} />
  {/if}
  {#if likes.length > 0}
    <NotificationSection label="Liked by" pubkeys={pluck("pubkey", likes)} />
  {/if}
  {#if replies.length > 0}
    <NotificationSection label="Replies" pubkeys={pluck("pubkey", replies)} />
  {/if}
</Content>
