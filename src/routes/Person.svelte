<script>
  import {find} from 'ramda'
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {timedelta} from 'src/util/misc'
  import Tabs from "src/partials/Tabs.svelte"
  import Button from "src/partials/Button.svelte"
  import Notes from "src/views/Notes.svelte"
  import Likes from "src/views/Likes.svelte"
  import {t, dispatch} from 'src/state/dispatch'
  import {modal} from "src/state/app"
  import relay from 'src/relay'
  import {user} from "src/relay"

  export let pubkey
  export let activeTab

  relay.ensurePerson({pubkey})

  const person = relay.lq(() => relay.db.people.get(pubkey))

  let following = $user && find(t => t[1] === pubkey, $user.petnames)

  const setActiveTab = tab => navigate(`/people/${pubkey}/${tab}`)

  const follow = () => {
    const petnames = $user.petnames
      .concat([t("p", pubkey, $person?.name)])

    dispatch('user/petnames', petnames)

    following = true
  }

  const unfollow = () => {
    const petnames = $user.petnames
      .filter(([_, pubkey]) => pubkey !== pubkey)

    dispatch('user/petnames', petnames)

    following = false
  }

  const openAdvanced = () => {
    modal.set({form: 'person/settings', person: $person || {pubkey}})
  }
</script>

<div class="max-w-xl m-auto flex flex-col gap-4 py-8 px-4">
  <div class="flex flex-col gap-4" in:fly={{y: 20}}>
    <div class="flex gap-4">
      <div
        class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
        style="background-image: url({$person?.picture})" />
      <div class="flex-grow">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl">{$person?.name || pubkey.slice(0, 8)}</h1>
          {#if $user && $user.pubkey !== pubkey}
            <i class="fa-solid fa-sliders cursor-pointer" on:click={openAdvanced} />
          {/if}
        </div>
        <p>{$person?.about || ''}</p>
      </div>
      <div class="whitespace-nowrap">
        {#if $user?.pubkey === pubkey}
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
<Notes showParent delta={timedelta(1, 'days')} filter={{kinds: [1], authors: [pubkey]}} />
{:else if activeTab === 'likes'}
<Likes author={pubkey} />
{:else if activeTab === 'network'}
{#if $person}
<Notes shouldMuffle filter={{kinds: [1], authors: $person.petnames.map(t => t[1])}} />
{:else}
<div class="py-16 max-w-xl m-auto flex justify-center">
  Unable to show network for this person.
</div>
{/if}
{/if}
