<script lang="ts">
  import {nip19} from "nostr-tools"
  import {ctx} from "@welshman/lib"
  import {formatTimestamp} from "@welshman/app"
  import Link from "@lib/components/Link.svelte"
  import Profile from "@app/components/Profile.svelte"
  import {entityLink} from "@app/state"

  export let event
  export let hideProfile = false

  const relays = ctx.app.router.Event(event).getUrls()
  const nevent = nip19.neventEncode({id: event.id, relays})
</script>

<div class="flex flex-col gap-2 {$$props.class}">
  <div class="flex justify-between gap-2">
    {#if !hideProfile}
      <Profile pubkey={event.pubkey} />
    {/if}
    <Link external href={entityLink(nevent)} class="text-sm opacity-75">
      {formatTimestamp(event.created_at)}
    </Link>
  </div>
  <slot />
</div>
