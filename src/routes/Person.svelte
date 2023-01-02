<script>
  import {find, when, propEq} from 'ramda'
  import {onMount, onDestroy} from 'svelte'
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {now} from 'src/util/misc'
  import {renderContent} from 'src/util/html'
  import {displayPerson} from 'src/util/nostr'
  import Tabs from "src/partials/Tabs.svelte"
  import Button from "src/partials/Button.svelte"
  import Notes from "src/views/person/Notes.svelte"
  import Likes from "src/views/person/Likes.svelte"
  import Network from "src/views/person/Network.svelte"
  import {modal} from "src/state/app"
  import relay, {user, people} from 'src/relay'

  export let pubkey
  export let activeTab

  let sub = null
  let following = $user && find(t => t[1] === pubkey, $user.petnames)

  onMount(async () => {
    sub = await relay.pool.listenForEvents(
      'routes/Person',
      [{kinds: [0, 1, 5, 7], authors: [pubkey], since: now()}],
      when(propEq('kind', 1), relay.loadNotesContext)
    )
  })

  onDestroy(() => {
    if (sub) {
      sub.unsub()
    }
  })

  const getPerson = () => $people[pubkey] || {pubkey}

  const setActiveTab = tab => navigate(`/people/${pubkey}/${tab}`)

  const follow = () => {
    relay.cmd.addPetname($user, pubkey, getPerson().name)

    following = true
  }

  const unfollow = () => {
    relay.cmd.removePetname($user, pubkey)

    following = false
  }

  const openAdvanced = () => {
    modal.set({form: 'person/settings', person: getPerson()})
  }
</script>

<div class="max-w-xl m-auto flex flex-col gap-4 py-8 px-4">
  <div class="flex flex-col gap-4" in:fly={{y: 20}}>
    <div class="flex gap-4">
      <div
        class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
        style="background-image: url({getPerson().picture})" />
      <div class="flex-grow">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl">{displayPerson(getPerson())}</h1>
          {#if $user && $user.pubkey !== pubkey}
            <i class="fa-solid fa-sliders cursor-pointer" on:click={openAdvanced} />
          {/if}
        </div>
        <p>{@html renderContent(getPerson().about || '')}</p>
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
<Notes {pubkey} />
{:else if activeTab === 'likes'}
<Likes {pubkey} />
{:else if activeTab === 'network'}
{#if $people[pubkey]}
<Network person={getPerson()} />
{:else}
<div class="py-16 max-w-xl m-auto flex justify-center">
  Unable to show network for this person.
</div>
{/if}
{/if}
