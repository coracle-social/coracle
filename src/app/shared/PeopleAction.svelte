<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import {router} from "src/app/router"

  export let pubkeys
  export let actionText
</script>

{#if pubkeys.length === 1}
  <Anchor
    modal
    href={router.at("people").of(pubkeys[0]).toString()}
    class="flex cursor-pointer items-center gap-2">
    <PersonCircle class="h-6 w-6" pubkey={pubkeys[0]} />
    <PersonName class="font-bold" pubkey={pubkeys[0]} />
    <span>{actionText}.</span>
  </Anchor>
{:else}
  <Anchor
    modal
    class="flex cursor-pointer gap-6"
    href={router.at("people/list").qp({pubkeys}).toString()}>
    <PersonCircles class="h-6 w-6" pubkeys={pubkeys.slice(0, 8)} />
    <span>{pubkeys.length} people {actionText}.</span>
  </Anchor>
{/if}
