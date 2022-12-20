<script>
  import {find} from 'ramda'
  import {onMount, onDestroy} from 'svelte'
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {getLastSync} from 'src/util/misc'
  import {getTagValues, findReply} from 'src/util/nostr'
  import Tabs from "src/partials/Tabs.svelte"
  import Button from "src/partials/Button.svelte"
  import Notes from "src/views/Notes.svelte"
  import {t, dispatch} from 'src/state/dispatch'
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
      async e => {
        if (e.kind === 1) {
          const filter = await relay.buildNoteContextFilter(e, {since})

          await relay.pool.loadEvents(filter)
        }

        if (e.kind === 7) {
          const replyId = findReply(e)

          if (replyId && !await relay.db.events.get(replyId)) {
            await relay.pool.loadEvents({kinds: [1], ids: [replyId]})
          }

        }
      }
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
    const notes = await relay.filterEvents(filter).reverse().sortBy('created_at')

    return relay.annotateChunk(notes.slice(0, limit))
  }

  const loadLikes = async limit => {
    const filter = {kinds: [7], authors: [pubkey]}
    const notes = await relay.filterEvents(filter).reverse().sortBy('created_at')

    return relay.annotateChunk(notes.slice(0, limit))
  }

  const loadNetwork = async limit => {
    const filter = {kinds: [1], authors: getTagValues(getPerson().petnames)}
    const notes = await relay.filterEvents(filter).reverse().sortBy('created_at')

    return relay.annotateChunk(notes.slice(0, limit))
  }

  const setActiveTab = tab => navigate(`/people/${pubkey}/${tab}`)

  const follow = () => {
    const petnames = $user.petnames
      .concat([t("p", pubkey, getPerson()?.name)])

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
<Notes showParent loadNotes={loadNotes} />
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
