<script lang="ts">
  import {last, find, reject} from 'ramda'
  import {onMount, onDestroy} from 'svelte'
  import {nip19} from 'nostr-tools'
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {renderContent} from 'src/util/html'
  import {displayPerson, Tags} from 'src/util/nostr'
  import Tabs from "src/partials/Tabs.svelte"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Notes from "src/views/person/Notes.svelte"
  import Likes from "src/views/person/Likes.svelte"
  import Relays from "src/views/person/Relays.svelte"
  import {getPubkeyRelays, getUserRelays, user} from "src/agent/helpers"
  import network from "src/agent/network"
  import keys from "src/agent/keys"
  import database from "src/agent/database"
  import {routes} from "src/app/ui"
  import {modal} from "src/app"
  import cmd from "src/agent/cmd"

  export let npub
  export let activeTab
  export let relays = []

  let subs = []
  let pubkey = nip19.decode(npub).data as string
  let following = false
  let followers = new Set()
  let followersCount = 0
  let person = database.getPersonWithFallback(pubkey)
  let loading = true

  $: following = find(t => t[1] === pubkey, $user?.petnames || [])

  onMount(async () => {
    // Add all the relays we know the person uses
    relays = relays.concat(getPubkeyRelays(pubkey))

    // Refresh our person if needed
    network.loadPeople(relays, [pubkey]).then(() => {
      person = database.getPersonWithFallback(pubkey)
      loading = false
    })

    // Get our followers count
    subs.push(
      await network.listen(
        relays,
        [{kinds: [3], '#p': [pubkey]}],
        e => {
          followers.add(e.pubkey)
          followersCount = followers.size
        },
        {shouldProcess: false},
      )
    )
  })

  onDestroy(() => {
    for (const sub of subs) {
      sub.unsub()
    }
  })

  const setActiveTab = tab => navigate(routes.person(pubkey, tab))

  const showFollows = () => {
    const pubkeys = Tags.wrap(person.petnames).pubkeys()

    modal.set({type: 'person/list', pubkeys})
   }

  const showFollowers = () => {
    modal.set({type: 'person/list', pubkeys: Array.from(followers)})
   }

  const follow = async () => {
    const tag = ["p", pubkey, relays[0].url, person.name || ""]
    const petnames = reject(t => t[1] === pubkey, $user.petnames).concat([tag])

    cmd.setPetnames(getUserRelays('write'), petnames)
  }

  const unfollow = async () => {
    const petnames = reject(t => t[1] === pubkey, $user.petnames)

    cmd.setPetnames(getUserRelays('write'), petnames)
  }

  const openAdvanced = () => {
    modal.set({type: 'person/settings', person})
  }

  const share = () => {
    modal.set({type: 'person/share', person})
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
      class="overflow-hidden w-16 h-16 sm:w-32 sm:h-32 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
      style="background-image: url({person.picture})" />
    <div class="flex flex-col gap-4 flex-grow">
      <div class="flex justify-between items-center gap-4">
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
        <div class="whitespace-nowrap flex gap-3 items-center flex-wrap">
          {#if $user?.pubkey === pubkey && keys.canSign()}
          <Anchor href="/profile"><i class="fa-solid fa-edit" /> Edit profile</Anchor>
          {:else if $user && keys.canSign()}
            <Anchor type="button-circle" on:click={openAdvanced}>
              <i class="fa fa-sliders" />
            </Anchor>
            <Anchor type="button-circle" href={`/messages/${npub}`}>
              <i class="fa fa-envelope" />
            </Anchor>
            {#if following}
            <Anchor type="button-circle" on:click={unfollow}>
              <i class="fa fa-user-minus" />
            </Anchor>
            {:else if $user}
            <Anchor type="button-circle" on:click={follow}>
              <i class="fa fa-user-plus" />
            </Anchor>
            {/if}
          {/if}
          <Anchor type="button-circle" on:click={share}>
            <i class="fa fa-share-nodes" />
          </Anchor>
        </div>
      </div>
      <p>{@html renderContent(person.about || '')}</p>
      {#if person?.petnames}
      <div class="flex gap-8">
        <button on:click={showFollows}>
          <strong>{person.petnames.length}</strong> following
        </button>
        <button on:click={showFollowers}>
          <strong>{followersCount}</strong> followers
        </button>
      </div>
      {/if}
    </div>
  </div>

  <Tabs tabs={['notes', 'likes', 'relays']} {activeTab} {setActiveTab} />

  {#if activeTab === 'notes'}
  <Notes {pubkey} />
  {:else if activeTab === 'likes'}
  <Likes {pubkey} />
  {:else if activeTab === 'relays'}
    {#if person?.petnames}
    <Relays person={person} />
    {:else if loading}
    <Spinner />
    {:else}
    <Content size="lg" class="text-center">
      Unable to show network for this person.
    </Content>
    {/if}
  {/if}
</Content>
