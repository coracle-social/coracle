<script lang="ts">
  import {without} from "ramda"
  import {displayList} from "hurdak"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import Card from "src/partials/Card.svelte"
  import {router} from "src/app/util/router"
  import {
    people,
    pubkey,
    channels,
    displayPerson,
    loadPubkeys,
    channelHasNewMessages,
  } from "src/engine"

  export let channel

  const pubkeys = channel.id.split(",") as string[]
  const displayPubkeys = pubkeys.length === 1 ? pubkeys : without([$pubkey], pubkeys)
  const showAlert = channels.key(channel.id).derived(channelHasNewMessages)
  const members = people.mapStore.derived($p => displayPubkeys.map(pk => $p.get(pk) || {pubkey: pk}))

  const enter = () => router.at("channels").of(pubkeys).push()

  loadPubkeys(pubkeys)
</script>

<Card interactive on:click={enter}>
  <div class="flex justify-between gap-8 px-2 py-4">
    <div class="flex gap-8">
      <PersonCircles pubkeys={displayPubkeys} />
      <h2>{displayList($members.map(displayPerson))}</h2>
    </div>
    <div class="relative">
      <i class="fa fa-bell" class:text-neutral-600={!$showAlert} />
      {#if $showAlert}
        <div class="absolute right-0 top-0 mt-1 h-1 w-1 rounded-full bg-accent" />
      {/if}
    </div>
  </div>
</Card>
