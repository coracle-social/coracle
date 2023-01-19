<script>
  import {last, find, reject} from 'ramda'
  import {onMount, onDestroy} from 'svelte'
  import {nip19} from 'nostr-tools'
  import {first} from 'hurdak/lib/hurdak'
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {renderContent} from 'src/util/html'
  import {displayPerson} from 'src/util/nostr'
  import Tabs from "src/partials/Tabs.svelte"
  import Content from "src/partials/Content.svelte"
  import Button from "src/partials/Button.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Notes from "src/views/person/Notes.svelte"
  import Likes from "src/views/person/Likes.svelte"
  import Network from "src/views/person/Network.svelte"
  import {getPerson, getRelays, listen, user, keys} from "src/agent"
  import {modal} from "src/app"
  import loaders from "src/app/loaders"
  import {routes} from "src/app/ui"
  import cmd from "src/app/cmd"

  export let npub
  export let activeTab
  export let relays = null

  const {canSign} = keys

  let subs = []
  let pubkey = nip19.decode(npub).data
  let following = false
  let followers = new Set()
  let followersCount = 0
  let person = getPerson(pubkey, true)
  let loading = true

  $: following = find(t => t[1] === pubkey, $user?.petnames || [])

  onMount(async () => {
    // Refresh our person if needed
    loaders.loadPeople(relays || getRelays(pubkey), [pubkey]).then(() => {
      person = getPerson(pubkey, true)
      loading = false
    })

    // Get our followers count
    subs.push(await listen(
      relays || getRelays(pubkey),
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
    const relay = first(relays || getRelays(pubkey))
    const tag = ["p", pubkey, relay.url, person.name || ""]
    const petnames = reject(t => t[1] === pubkey, $user.petnames).concat([tag])

    cmd.setPetnames(getRelays(), petnames)
  }

  const unfollow = async () => {
    const petnames = reject(t => t[1] === pubkey, $user.petnames)

    cmd.setPetnames(getRelays(), petnames)
  }

  const openAdvanced = () => {
    modal.set({form: 'person/settings', person})
  }
</script>

<div
  class="absolute w-full h-64"
  style="z-index: -1;
         background-size: cover;
         background-image:
          linear-gradient(to bottom, rgba(0, 0, 0, 0.3), #0f0f0e),
          url('{person.banner}')" />

<Content>
  <div class="flex gap-4" in:fly={{y: 20}}>
    <div
      class="overflow-hidden w-32 h-32 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
      style="background-image: url({person.picture})" />
    <div class="flex flex-col gap-4">
      <div class="flex items-start gap-4">
        <div class="flex-grow flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <h1 class="text-2xl">{displayPerson(person)}</h1>
          </div>
          {#if person.verified_as}
          <div class="flex gap-1 text-sm">
            <i class="fa fa-user-check text-accent" />
            <span class="text-light">{last(person.verified_as.split('@'))}</span>
          </div>
          {/if}
        </div>
        <div class="whitespace-nowrap flex gap-4 items-center">
          {#if $user?.pubkey === pubkey && $canSign}
          <a href="/profile" class="cursor-pointer text-sm">
            <i class="fa-solid fa-edit" /> Edit
          </a>
          {/if}
          {#if $user && $user.pubkey !== pubkey}
            <i class="fa-solid fa-sliders cursor-pointer" on:click={openAdvanced} />
          {/if}
          {#if $user?.petnames && $canSign}
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
      <p>{@html renderContent(person.about || '')}</p>
      {#if person?.petnames}
      <div class="flex gap-8">
        <div><strong>{person.petnames.length}</strong> following</div>
        <div><strong>{followersCount}</strong> followers</div>
      </div>
      {/if}
    </div>
  </div>

  <Tabs tabs={['notes', 'likes', 'network']} {activeTab} {setActiveTab} />

  {#if activeTab === 'notes'}
  <Notes {pubkey} />
  {:else if activeTab === 'likes'}
  <Likes {pubkey} />
  {:else if activeTab === 'network'}
    {#if person?.petnames}
    <Network person={person} />
    {:else if loading}
    <Spinner />
    {:else}
    <Content size="lg" class="text-center">
      Unable to show network for this person.
    </Content>
    {/if}
  {/if}
</Content>
