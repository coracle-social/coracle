<script>
  import {find} from 'ramda'
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import Tabs from "src/partials/Tabs.svelte"
  import Button from "src/partials/Button.svelte"
  import Notes from "src/views/Notes.svelte"
  import Likes from "src/views/Likes.svelte"
  import {user as currentUser} from 'src/state/user'
  import {t, dispatch} from 'src/state/dispatch'
  import {modal} from "src/state/app"
  import relay from 'src/relay'

  export let pubkey
  export let activeTab

  const user = relay.lq(() => relay.db.users.get(pubkey))

  let following = $currentUser && find(t => t[1] === pubkey, $currentUser.petnames)

  const setActiveTab = tab => navigate(`/users/${pubkey}/${tab}`)

  const follow = () => {
    const petnames = $currentUser.petnames
      .concat([t("p", pubkey, $user?.name)])

    dispatch('account/petnames', petnames)

    following = true
  }

  const unfollow = () => {
    const petnames = $currentUser.petnames
      .filter(([_, pubkey]) => pubkey !== pubkey)

    dispatch('account/petnames', petnames)

    following = false
  }

  const openAdvanced = () => {
    modal.set({form: 'user/advanced', user: $user || {pubkey}})
  }
</script>

<div class="max-w-xl m-auto flex flex-col gap-4 py-8 px-4">
  <div class="flex flex-col gap-4" in:fly={{y: 20}}>
    <div class="flex gap-4">
      <div
        class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
        style="background-image: url({$user?.picture})" />
      <div class="flex-grow">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl">{$user?.name || pubkey.slice(0, 8)}</h1>
          {#if $currentUser && $currentUser.pubkey !== pubkey}
            <i class="fa-solid fa-sliders cursor-pointer" on:click={openAdvanced} />
          {/if}
        </div>
        <p>{$user?.about || ''}</p>
      </div>
      <div class="whitespace-nowrap">
        {#if $currentUser?.pubkey === pubkey}
        <a href="/profile" class="cursor-pointer text-sm">
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
<Notes filter={{kinds: [1], authors: [pubkey]}} />
{:else if activeTab === 'likes'}
<Likes author={pubkey} />
{:else if activeTab === 'network'}
{#if $user}
<Notes shouldMuffle filter={{kinds: [1], authors: $user.petnames.map(t => t[1])}} />
{:else}
<div class="py-16 max-w-xl m-auto flex justify-center">
  Unable to show network for this user.
</div>
{/if}
{/if}
