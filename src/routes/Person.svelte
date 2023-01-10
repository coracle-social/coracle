<script>
  import {find, propEq, reject} from 'ramda'
  import {onMount, onDestroy} from 'svelte'
  import {nip19} from 'nostr-tools'
  import {first} from 'hurdak/lib/hurdak'
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {now, batch} from 'src/util/misc'
  import {renderContent} from 'src/util/html'
  import {displayPerson, personKinds} from 'src/util/nostr'
  import Tabs from "src/partials/Tabs.svelte"
  import Button from "src/partials/Button.svelte"
  import Notes from "src/views/person/Notes.svelte"
  import Likes from "src/views/person/Likes.svelte"
  import Network from "src/views/person/Network.svelte"
  import {getPerson, getRelays, listen, user} from "src/agent"
  import {modal} from "src/app"
  import loaders from "src/app/loaders"
  import {routes} from "src/app/ui"
  import cmd from "src/app/cmd"

  export let npub
  export let activeTab

  let subs = []
  let pubkey = nip19.decode(npub).data
  let following = find(t => t[1] === pubkey, $user?.petnames || [])
  let followers = new Set()
  let followersCount = 0
  let person = getPerson(pubkey, true)

  onMount(async () => {
    subs.push(await listen(
      getRelays(pubkey),
      [{kinds: [1, 5, 7], authors: [pubkey], since: now()},
       {kinds: personKinds, authors: [pubkey]}],
      batch(300, events => {
        const profiles = events.filter(propEq('kind', 0))
        const notes = events.filter(propEq('kind', 1))

        if (profiles.length > 0) {
          person = getPerson(pubkey, true)
        }

        if (notes.length > 0) {
          loaders.loadNoteContext(notes)
        }
      })
    ))

    subs.push(await listen(
      getRelays(pubkey),
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

  const setActiveTab = tab => navigate(routes.person(pubkey, tab))

  const follow = async () => {
    following = true

    const relay = first(getRelays(pubkey))
    const tag = ["p", pubkey, relay, person.name || ""]
    const petnames = reject(t => t[1] === pubkey, $user.petnames).concat(tag)

    cmd.setPetnames(getRelays(), petnames)
  }

  const unfollow = async () => {
    following = false

    const petnames = reject(t => t[1] === pubkey, $user.petnames)

    cmd.setPetnames(getRelays(), petnames)
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
        {:else if $user?.petnames}
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
  {#if person?.petnames}
  <div class="flex gap-8 ml-16">
    <div><strong>{person.petnames.length}</strong> following</div>
    <div><strong>{followersCount}</strong> followers</div>
  </div>
  {/if}
</div>

<Tabs tabs={['notes', 'likes', 'network']} {activeTab} {setActiveTab} />
{#if activeTab === 'notes'}
<Notes {pubkey} />
{:else if activeTab === 'likes'}
<Likes {pubkey} />
{:else if activeTab === 'network'}
{#if person?.petnames}
<Network person={person} />
{:else}
<div class="py-16 max-w-xl m-auto flex justify-center">
  Unable to show network for this person.
</div>
{/if}
{/if}
