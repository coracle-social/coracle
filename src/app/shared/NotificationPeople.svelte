<script lang="ts">
  import {uniq, pluck} from "ramda"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import {router} from "src/app/router"
  import type {Notification} from "src/engine"

  export let notification: Notification
  export let actionText

  const pubkeys = uniq(pluck("pubkey", notification.interactions))

  const showPerson = () => router.at("people").of(pubkeys[0]).open()
  const showPeople = () => router.at("people/list").qp({pubkeys}).open()
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
