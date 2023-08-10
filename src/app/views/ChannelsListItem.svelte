<script>
  import {navigate} from "svelte-routing"
  import {displayList} from "hurdak"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import Card from "src/partials/Card.svelte"
  import {Directory, Nip24} from "src/app/engine"

  export let channel

  const pubkeys = channel.id.split(",")
  const hasNewMessages = Nip24.channels.key(channel.id).derived(Nip24.messageIsNew)
  const profiles = Directory.profiles.derived(() => pubkeys.map(Directory.getProfile))

  const enter = () => navigate(`/channels/${channel.id}`)
</script>

<Card interactive on:click={enter}>
  <div class="flex justify-between gap-8 px-2 py-4">
    <div class="flex gap-8">
      <div class="flex">
        {#each pubkeys as pubkey (pubkey)}
          <div class="-mr-3 inline-block">
            <PersonCircle size={8} class="h-8 w-8" {pubkey} />
          </div>
        {/each}
      </div>
      <h2>{displayList($profiles.map(Directory.displayProfile))}</h2>
    </div>
    <div class="relative">
      <i class="fa fa-bell" class:text-gray-5={!$hasNewMessages} />
      {#if $hasNewMessages}
        <div class="absolute right-0 top-0 mt-1 h-1 w-1 rounded-full bg-accent" />
      {/if}
    </div>
  </div>
</Card>
