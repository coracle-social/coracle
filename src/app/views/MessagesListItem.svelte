<script lang="ts">
  import {nip19} from "nostr-tools"
  import {navigate} from "svelte-routing"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import Card from "src/partials/Card.svelte"
  import {displayPubkey, hasNewMessages} from "src/engine"

  export let channel

  const showAlert = hasNewMessages(channel)
  const npub = nip19.npubEncode(channel.id)

  const enter = () => navigate(`/conversations/${npub}`)
</script>

<Card interactive on:click={enter}>
  <div class="flex gap-4 px-4 py-6">
    <PersonCircle size={14} pubkey={channel.id} />
    <div class="flex min-w-0 flex-grow flex-col justify-start gap-2">
      <div class="flex flex-grow items-start justify-between gap-2">
        <div class="flex items-center gap-2 overflow-hidden">
          <i class="fa fa-lock text-gray-1" />
          <h2 class="text-lg">{displayPubkey(channel.id)}</h2>
        </div>
        <div class="relative">
          <i class="fa fa-bell" class:text-gray-5={!showAlert} />
          {#if showAlert}
            <div class="absolute right-0 top-0 mt-1 h-1 w-1 rounded-full bg-accent" />
          {/if}
        </div>
      </div>
      <PersonAbout truncate pubkey={channel.id} />
    </div>
  </div>
</Card>
