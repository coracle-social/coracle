<script>
  import {navigate} from 'svelte-routing'
  import {timedelta} from 'src/util/misc'
  import Anchor from "src/partials/Anchor.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Notes from "src/views/Notes.svelte"
  import {user, relays} from "src/state/app"

  export let activeTab

  const authors = $user ? $user.petnames.map(t => t[1]) : []
  const setActiveTab = tab => navigate(`/notes/${tab}`)
</script>

{#if $relays.length === 0}
<div class="flex w-full justify-center items-center py-16">
  <div class="text-center max-w-md">
    You aren't yet connected to any relays. Please click <Anchor href="/relays"
      >here</Anchor
    > to get started.
  </div>
</div>
{:else}
<Tabs tabs={['global', 'follows']} {activeTab} {setActiveTab} />
{#if activeTab === 'follows' && authors.length === 0}
<div class="flex w-full justify-center items-center py-16">
  <div class="text-center max-w-md">
    You haven't yet followed anyone. Visit a user's profile to follow them.
  </div>
</div>
{:else if activeTab === 'follows'}
<Notes filter={{kinds: [1], authors}} shouldMuffle />
{:else}
<Notes filter={{kinds: [1]}} shouldMuffle />
{/if}
<div class="fixed bottom-0 right-0 p-8">
  <a
    href="/notes/new"
    class="rounded-full bg-accent color-white w-16 h-16 flex justify-center
            items-center border border-dark shadow-2xl cursor-pointer">
    <span class="fa-sold fa-plus fa-2xl" />
  </a>
</div>
{/if}

