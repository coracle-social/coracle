<script>
  import {find, take, when, propEq} from 'ramda'
  import {onMount, onDestroy} from 'svelte'
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {getLastSync} from 'src/util/misc'
  import {getTagValues} from 'src/util/nostr'
  import Tabs from "src/partials/Tabs.svelte"
  import Button from "src/partials/Button.svelte"
  import Notes from "src/partials/Notes.svelte"
  import {modal} from "src/state/app"
  import relay, {user, people} from 'src/relay'

  export let pubkey
  export let activeTab

  let sub = null
  let following = $user && find(t => t[1] === pubkey, $user.petnames)
  let since = getLastSync(['Person', pubkey])

  onMount(async () => {
    sub = await relay.pool.listenForEvents(
      'routes/Person',
      [{kind: [0, 1, 5, 7], authors: [pubkey], since}],
      when(propEq('kind', 1), relay.loadNoteContext)
    )
  })

  onDestroy(() => {
    if (sub) {
      sub.unsub()
    }
  })

  const getPerson = () => $people[pubkey]

  const loadNotes = async limit => {
    const filter = {kinds: [1], authors: [pubkey]}

    return relay.annotateChunk(take(limit, await relay.filterEvents(filter)))
  }

  const loadLikes = async limit => {
    const events = await relay.annotateChunk(
      take(limit, await relay.filterEvents({
        kinds: [7],
        authors: [pubkey],
        muffle: getTagValues($user?.muffle || []),
      }))
    )

    return events.filter(e => e.kind === 1)
  }

  const loadNetwork = async limit => {
    return relay.annotateChunk(take(limit, await relay.filterEvents({
      kinds: [1],
      authors: getTagValues(getPerson().petnames),
      muffle: getTagValues($user?.muffle || []),
    })))
  }

  const setActiveTab = tab => navigate(`/people/${pubkey}/${tab}`)

  const follow = () => {
    relay.cmd.addPetname($user, pubkey, getPerson()?.name)

    following = true
  }

  const unfollow = () => {
    relay.cmd.removePetname($user, pubkey)

    following = false
  }

  const openAdvanced = () => {
    modal.set({form: 'person/settings', person: getPerson() || {pubkey}})
  }
</script>

<div class="max-w-xl m-auto flex flex-col gap-4 py-8 px-4">
  <div class="flex flex-col gap-4" in:fly={{y: 20}}>
    <div class="flex gap-4">
      <div
        class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
        style="background-image: url({getPerson()?.picture})" />
      <div class="flex-grow">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl">{getPerson()?.name || pubkey.slice(0, 8)}</h1>
          {#if $user && $user.pubkey !== pubkey}
            <i class="fa-solid fa-sliders cursor-pointer" on:click={openAdvanced} />
          {/if}
        </div>
        <p>{getPerson()?.about || ''}</p>
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
<Notes loadNotes={loadNotes} />
{:else if activeTab === 'likes'}
<Notes loadNotes={loadLikes} />
{:else if activeTab === 'network'}
{#if getPerson()}
<Notes shouldMuffle loadNotes={loadNetwork} />
{:else}
<div class="py-16 max-w-xl m-auto flex justify-center">
  Unable to show network for this person.
</div>
{/if}
{/if}
