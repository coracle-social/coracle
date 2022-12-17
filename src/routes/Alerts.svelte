<script>
  import {fly} from 'svelte/transition'
  import {now} from 'src/util/misc'
  import {findReply} from 'src/util/nostr'
  import {ellipsize} from 'hurdak/src/core'
  import relay from 'src/relay'
  import {alerts, modal, user} from 'src/state/app'
  import UserBadge from "src/partials/UserBadge.svelte"
  import Note from 'src/views/Note.svelte'

  const events = relay.lq(async () => {
    const alerts = await relay.filterAlerts($user)
    const events = await alerts.limit(10).reverse().sortBy('created_at')

    return events
      // Add parent in
      .map(e => ({...e, parent: relay.filterEvents({ids: [findReply(e)]}).first()}))
      // Only show stuff if it's a direct reply to my note
      .filter(e => e.parent?.pubkey === $user.pubkey)
  })

  // Clear notification badge
  alerts.set({since: now()})
</script>

<ul class="py-4 flex flex-col gap-2 max-w-xl m-auto">
  {#each ($events || []) as e (e.id)}
  {#if e.kind === 7}
  <li
    in:fly={{y: 20}}
    class="py-2 px-3 flex flex-col gap-2 text-white cursor-pointer transition-all
           border border-solid border-black hover:border-medium hover:bg-dark"
    on:click={() => modal.set({note: e.parent})}>
    <div class="flex gap-2 items-center">
      <UserBadge user={e.user} />
      <span>liked your note.</span>
    </div>
    <div class="ml-6 text-light">
      {ellipsize(e.parent.content, 240)}
    </div>
  </li>
  {:else}
  <li in:fly={{y: 20}}><Note showParent note={e} /></li>
  {/if}
  {/each}
</ul>


{#if $events?.length === 0}
<div in:fly={{y: 20}} class="flex w-full justify-center items-center py-16">
  <div class="text-center max-w-md">
    No recent activity found.
  </div>
</div>
{/if}
