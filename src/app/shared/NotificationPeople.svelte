<script lang="ts">
  import {uniq, pluck} from "ramda"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import type {Notification} from "src/engine"

  export let notification: Notification
  export let actionText

  const pubkeys = uniq(pluck("pubkey", notification.interactions))

  const showPerson = () => modal.push({type: "person/detail", pubkey: pubkeys[0]})
  const showPeople = () => modal.push({type: "person/list", pubkeys})
</script>

{#if pubkeys.length === 1}
  <Anchor on:click={showPerson} class="flex cursor-pointer items-center gap-2">
    <PersonCircle class="h-6 w-6" pubkey={pubkeys[0]} />
    <PersonName class="font-bold" pubkey={pubkeys[0]} />
    <span>{actionText}.</span>
  </Anchor>
{:else}
  <div class="flex cursor-pointer gap-6" on:click={showPeople}>
    <PersonCircles class="h-6 w-6" pubkeys={pubkeys.slice(0, 8)} />
    <span>{pubkeys.length} people {actionText}.</span>
  </div>
{/if}
