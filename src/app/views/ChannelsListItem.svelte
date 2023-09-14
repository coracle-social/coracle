<script lang="ts">
  import {navigate} from "svelte-routing"
  import {displayList} from "hurdak"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import Card from "src/partials/Card.svelte"
  import {people, channels, displayPerson, loadPubkeys, hasNewMessages} from "src/engine2"

  export let channel

  const pubkeys = channel.id.split(",")
  const showAlert = channels.key(channel.id).derived(hasNewMessages)
  const members = people.mapStore.derived($p => pubkeys.map(pk => $p.get(pk)))

  const enter = () => navigate(`/channels/${channel.id}`)

  loadPubkeys(pubkeys)
</script>

<Card interactive on:click={enter}>
  <div class="flex justify-between gap-8 px-2 py-4">
    <div class="flex gap-8">
      <PersonCircles {pubkeys} />
      <h2>{displayList($members.map(displayPerson))}</h2>
    </div>
    <div class="relative">
      <i class="fa fa-bell" class:text-gray-5={!$showAlert} />
      {#if $showAlert}
        <div class="absolute right-0 top-0 mt-1 h-1 w-1 rounded-full bg-accent" />
      {/if}
    </div>
  </div>
</Card>
