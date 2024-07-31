<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import PersonBadgeSmall from "src/app/shared/PersonBadgeSmall.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import {router} from "src/app/util/router"

  export let pubkeys
  export let actionText
</script>

{#if pubkeys.length === 1}
  <Anchor
    modal
    href={router.at("people").of(pubkeys[0]).toString()}
    class="flex cursor-pointer items-center gap-1">
    <PersonBadgeSmall inert pubkey={pubkeys[0]} />
    <span>{actionText}.</span>
  </Anchor>
{:else}
  <Anchor
    modal
    class="flex cursor-pointer gap-1"
    href={router.at("people/list").qp({pubkeys}).toString()}>
    <PersonCircles class="h-6 w-6" pubkeys={pubkeys.slice(0, 8)} />
    <span>{pubkeys.length} people {actionText}.</span>
  </Anchor>
{/if}
