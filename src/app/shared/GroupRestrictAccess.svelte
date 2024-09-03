<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import {session} from "@welshman/app"
  import {publishGroupEntryRequest, GroupAccess, deriveGroupStatus} from "src/engine"

  export let address

  const status = deriveGroupStatus(address)
</script>

<p class="m-auto max-w-sm py-12 text-center">
  {#if $status.access === GroupAccess.Requested}
    Your access request is awaiting approval.
  {:else}
    You don't have access to this group.
  {/if}
  {#if $session && !$status.access}
    Click <Anchor underline on:click={() => publishGroupEntryRequest(address)}>here</Anchor> to request
    entry.
  {/if}
</p>
