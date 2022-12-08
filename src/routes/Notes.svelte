<script>
  import {writable} from 'svelte/store'
  import {navigate} from 'svelte-routing'
  import Anchor from "src/partials/Anchor.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Notes from "src/partials/Notes.svelte"
  import {relays} from "src/state/nostr"
  import {user} from "src/state/user"

  export let activeTab

  const globalNotes = writable([])
  const followNotes = writable([])
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
<Notes notes={followNotes} filter={{kinds: [1], authors}} shouldMuffle />
{:else}
<Notes notes={globalNotes} filter={{kinds: [1]}} shouldMuffle />
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

