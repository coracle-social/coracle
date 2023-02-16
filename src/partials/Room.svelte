<script>
  import {onMount} from 'svelte'
  import {fly} from 'svelte/transition'
  import {ellipsize} from 'hurdak/lib/hurdak'
  import Anchor from 'src/partials/Anchor.svelte'
  import {displayPerson} from 'src/util/nostr'
  import {now, timedelta} from 'src/util/misc'
  import messages from 'src/app/messages'

  export let joined = false
  export let room
  export let setRoom
  export let joinRoom
  export let leaveRoom

  let hasNewMessages = false

  const {mostRecentByPubkey, lastCheckedByPubkey} = messages

  onMount(() => {
    const interval = setInterval(() => {
      // TODO notifications for channel messages
      if (room.type === 'npub') {
        const mostRecent = $mostRecentByPubkey[room.pubkey] || 0
        const lastChecked = $lastCheckedByPubkey[room.pubkey] || 0

        // Include a cut-off since we lose read receipts every log out
        hasNewMessages = mostRecent > now() - timedelta(7, 'days') && lastChecked < mostRecent
      }
    }, 1000)

    return () => clearInterval(interval)
  })
</script>

<button
  class="flex gap-4 px-4 py-6 cursor-pointer hover:bg-medium transition-all rounded border border-solid border-medium bg-dark"
  on:click={() => setRoom(room)}
  in:fly={{y: 20}}>
  <div
    class="overflow-hidden w-14 h-14 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
    style="background-image: url({room.picture})" />
  <div class="flex flex-grow flex-col justify-start gap-2 min-w-0">
    <div class="flex flex-grow items-start justify-between gap-2">
      <div class="flex gap-2 items-center overflow-hidden">
        {#if room.type === 'npub'}
        <i class="fa fa-lock text-light" />
        <h2 class="text-lg">{displayPerson(room)}</h2>
        {:else}
        <i class="fa fa-lock-open text-light" />
        <h2 class="text-lg">{room.name}</h2>
        {/if}
      </div>
      {#if room.type === 'npub'}
        {#if hasNewMessages}
        <div class="relative">
          <i class="fa fa-bell" />
          <div class="absolute top-0 right-0 mt-1 w-1 h-1 bg-accent rounded-full" />
        </div>
        {:else}
        <i class="fa fa-bell text-light" />
        {/if}
      {/if}
      {#if room.type === 'note'}
        {#if joined}
        <Anchor type="button" class="flex items-center gap-2" on:click={e => { e.stopPropagation(); leaveRoom(room.id) }}>
          <i class="fa fa-right-from-bracket" />
          <span>Leave</span>
        </Anchor>
        {:else}
        <Anchor type="button" class="flex items-center gap-2" on:click={e => { e.stopPropagation(); joinRoom(room.id) }}>
          <i class="fa fa-right-to-bracket" />
          <span>Join</span>
        </Anchor>
        {/if}
      {/if}
    </div>
    {#if room.about}
    <p class="text-light text-start">
      {ellipsize(room.about, 300)}
    </p>
    {/if}
  </div>
</button>
