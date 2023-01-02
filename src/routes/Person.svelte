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

  let subs = []
  let following = $user && find(t => t[1] === pubkey, $user.petnames)
  let followers = new Set()
  let followersCount = 0
  let person

  $: {
    person = $people[pubkey] || {pubkey}
  }

  onMount(async () => {
    subs.push(await relay.pool.listenForEvents(
      'routes/Person',
      [{kinds: [1, 5, 7], authors: [pubkey], since: now()},
       {kinds: [0, 3, 12165], authors: [pubkey]}],
      when(propEq('kind', 1), relay.loadNoteContext)
    ))

    subs.push(await relay.pool.listenForEvents(
      'routes/Person/followers',
      [{kinds: [3], '#p': [pubkey]}],
      e => {
        followers.add(e.pubkey)
        followersCount = followers.size
      },
      {shouldProcess: false},
    ))
  })

  onDestroy(() => {
    for (const sub of subs) {
      sub.unsub()
    }
  })

  const setActiveTab = tab => navigate(`/people/${pubkey}/${tab}`)

  const follow = async () => {
    following = true

    // Make sure our follow list is up to date
    await relay.pool.loadPeople([$user.pubkey], {kinds: [3]})

    relay.cmd.addPetname($user, pubkey, person.name)
  }

  const unfollow = async () => {
    following = false

    // Make sure our follow list is up to date
    await relay.pool.loadPeople([$user.pubkey], {kinds: [3]})

    relay.cmd.removePetname($user, pubkey)
  }

  const openAdvanced = () => {
    modal.set({form: 'person/settings', person})
  }
</script>

<div class="max-w-xl m-auto flex flex-col gap-4 py-8 px-4">
  <div class="flex flex-col gap-4" in:fly={{y: 20}}>
    <div class="flex gap-4">
      <div
        class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
        style="background-image: url({person.picture})" />
      <div class="flex-grow">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl">{displayPerson(person)}</h1>
          {#if $user && $user.pubkey !== pubkey}
            <i class="fa-solid fa-sliders cursor-pointer" on:click={openAdvanced} />
          {/if}
        </div>
        <p>{@html renderContent(person.about || '')}</p>
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
  <div class="flex gap-8 ml-16">
    <div><strong>{person?.petnames?.length}</strong> following</div>
    <div><strong>{followersCount}</strong> followers</div>
  </div>
</div>

<Tabs tabs={['notes', 'likes', 'network']} {activeTab} {setActiveTab} />
{#if activeTab === 'notes'}
<Notes {pubkey} />
{:else if activeTab === 'likes'}
<Likes {pubkey} />
{:else if activeTab === 'network'}
{#if person}
<Network person={person} />
{:else}
<div class="py-16 max-w-xl m-auto flex justify-center">
  Unable to show network for this person.
</div>
{/if}
{/if}
