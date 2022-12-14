<script>
  import {writable} from 'svelte/store'
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import Notes from "src/partials/Notes.svelte"
  import Likes from "src/partials/Likes.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Button from "src/partials/Button.svelte"
  import {user as currentUser} from 'src/state/user'
  import {t, dispatch} from 'src/state/dispatch'
  import {accounts, getFollow, modal} from "src/state/app"

  export let pubkey
  export let activeTab

  const user = $accounts[pubkey]
  const notes = writable([])
  const likes = writable([])
  const network = writable([])
  const authors = $currentUser ? $currentUser.petnames.map(t => t[1]) : []

  let following = getFollow(pubkey)

  const setActiveTab = tab => navigate(`/users/${pubkey}/${tab}`)

  const follow = () => {
    const petnames = $currentUser.petnames
      .concat([t("p", user.pubkey, user.name)])

    dispatch('account/petnames', petnames)

    following = true
  }

  const unfollow = () => {
    const petnames = $currentUser.petnames
      .filter(([_, pubkey]) => pubkey !== user.pubkey)

    dispatch('account/petnames', petnames)

    following = false
  }

  const openAdvanced = () => {
    modal.set({form: 'user/advanced', user})
  }
</script>

<div class="max-w-xl m-auto flex flex-col gap-4 py-8 px-4">
  <div class="flex flex-col gap-4" in:fly={{y: 20}}>
    <div class="flex gap-4">
      <div
        class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
        style="background-image: url({user?.picture})" />
      <div class="flex-grow">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl">{user?.name || pubkey.slice(0, 8)}</h1>
          {#if $currentUser && $currentUser.pubkey !== pubkey}
            <i class="fa-solid fa-sliders cursor-pointer" on:click={openAdvanced} />
          {/if}
        </div>
        <p>{user?.about || ''}</p>
      </div>
      <div class="whitespace-nowrap">
        {#if $currentUser?.pubkey === pubkey}
        <a href="/settings/profile" class="cursor-pointer text-sm">
          <i class="fa-solid fa-edit" /> Edit
        </a>
        {:else}
        <div class="flex flex-col items-end gap-2">
          {#if following}
          <Button on:click={unfollow}>Unfollow</Button>
          {:else}
          <Button on:click={follow}>Follow</Button>
          {/if}
        </div>
        {/if}
      </div>
    </div>
  </div>
</div>
<Tabs tabs={['notes', 'likes', 'network']} {activeTab} {setActiveTab} />
{#if activeTab === 'notes'}
<Notes notes={notes} filter={{kinds: [1], authors: [pubkey]}} />
{:else if activeTab === 'likes'}
<Likes notes={likes} author={pubkey} />
{:else if activeTab === 'network'}
<Notes notes={network} filter={{kinds: [1], authors}} shouldMuffle />
{/if}
