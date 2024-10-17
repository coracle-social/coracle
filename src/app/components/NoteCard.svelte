<script lang="ts">
  import {nip19} from "nostr-tools"
  import {ctx} from "@welshman/lib"
  import {getListTags, getPubkeyTagValues} from "@welshman/util"
  import {formatTimestamp, userMutes} from "@welshman/app"
  import Link from "@lib/components/Link.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Profile from "@app/components/Profile.svelte"
  import {entityLink} from "@app/state"

  export let event
  export let hideProfile = false

  const relays = ctx.app.router.Event(event).getUrls()
  const nevent = nip19.neventEncode({id: event.id, relays})

  const ignoreMute = () => {
    muted = false
  }

  let muted = getPubkeyTagValues(getListTags($userMutes)).includes(event.pubkey)
</script>

<div class="flex flex-col gap-2 {$$props.class}">
  {#if muted}
    <div class="flex justify-between items-center">
      <div class="row-2 relative">
        <Icon icon="danger" class="mt-1" />
        <p>You have muted this person.<p>
      </div>
      <Button class="link ml-8" on:click={ignoreMute}>Show anyway</Button>
    </div>
  {:else}
    <div class="flex justify-between gap-2">
      {#if !hideProfile}
        <Profile pubkey={event.pubkey} />
      {/if}
      <Link external href={entityLink(nevent)} class="text-sm opacity-75">
        {formatTimestamp(event.created_at)}
      </Link>
    </div>
    <slot />
  {/if}
</div>
