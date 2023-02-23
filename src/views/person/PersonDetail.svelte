<script lang="ts">
  import {last} from 'ramda'
  import {onMount} from 'svelte'
  import {tweened} from 'svelte/motion'
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {log} from 'src/util/logger'
  import {renderContent} from 'src/util/html'
  import {displayPerson, Tags, toHex} from 'src/util/nostr'
  import Tabs from "src/partials/Tabs.svelte"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import NewNoteButton from "src/views/notes/NewNoteButton.svelte"
  import Notes from "src/views/person/Notes.svelte"
  import Likes from "src/views/person/Likes.svelte"
  import Relays from "src/views/person/Relays.svelte"
  import user from "src/agent/user"
  import {sampleRelays, getPubkeyWriteRelays} from "src/agent/relays"
  import network from "src/agent/network"
  import database from "src/agent/database"
  import {routes, modal} from "src/app/ui"

  export let npub
  export let activeTab
  export let relays = []

  const interpolate = (a, b) => t => a + Math.round((b - a) * t)
  const {petnamePubkeys, canPublish} = user
  const getRelays = () => sampleRelays(relays.concat(getPubkeyWriteRelays(pubkey)))

  let pubkey = toHex(npub)
  let following = false
  let followers = new Set()
  let followersCount = tweened(0, {interpolate, duration: 1000})
  let person = database.getPersonWithFallback(pubkey)
  let loading = true

  $: following = $petnamePubkeys.includes(pubkey)

  onMount(async () => {
    log('Person', npub, person)

    // Refresh our person
    network.loadPeople([pubkey], {force: true}).then(() => {
      person = database.getPersonWithFallback(pubkey)
      loading = false
    })

    // Prime our followers count
    database.people.all().forEach(p => {
      if (Tags.wrap(p.petnames).type("p").values().all().includes(pubkey)) {
        followers.add(p.pubkey)
        followersCount.set(followers.size)
      }
    })

    // Round out our followers count
    await network.load({
      shouldProcess: false,
      relays: getRelays(),
      filter: [{kinds: [3], '#p': [pubkey]}],
      onChunk: events => {
        for (const e of events) {
          followers.add(e.pubkey)
        }

        followersCount.set(followers.size)
      },
    })
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
    const [{url}] = getRelays()

    user.addPetname(pubkey, url, displayPerson(person))
  }

  const unfollow = async () => {
    user.removePetname(pubkey)
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
          url('{person.kind0?.banner}')" />

<Content>
  <div class="flex gap-4" in:fly={{y: 20}}>
    <div
      class="overflow-hidden w-16 h-16 sm:w-32 sm:h-32 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
      style="background-image: url({person.kind0?.picture})" />
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
          {#if user.getPubkey() === pubkey && $canPublish}
          <Anchor href="/profile"><i class="fa-solid fa-edit" /> Edit profile</Anchor>
          {:else if $canPublish}
            <Anchor type="button-circle" on:click={openAdvanced}>
              <i class="fa fa-sliders" />
            </Anchor>
            <Anchor type="button-circle" href={`/messages/${npub}`}>
              <i class="fa fa-envelope" />
            </Anchor>
          {/if}
          {#if following}
          <Anchor type="button-circle" on:click={unfollow}>
            <i class="fa fa-user-minus" />
          </Anchor>
          {:else if user.getPubkey() !== pubkey}
          <Anchor type="button-circle" on:click={follow}>
            <i class="fa fa-user-plus" />
          </Anchor>
          {/if}
          <Anchor type="button-circle" on:click={share}>
            <i class="fa fa-share-nodes" />
          </Anchor>
        </div>
      </div>
      <p>{@html renderContent(person?.kind0?.about || '')}</p>
      {#if person?.petnames}
      <div class="flex gap-8" in:fly={{y: 20}}>
        <button on:click={showFollows}>
          <strong>{person.petnames.length}</strong> following
        </button>
        <button on:click={showFollowers}>
          <strong>{$followersCount}</strong> followers
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
    {#if person?.relays}
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

<NewNoteButton {pubkey} />
