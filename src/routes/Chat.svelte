<script>
  import {uniq, pluck} from 'ramda'
  import {onMount} from "svelte"
  import {nip19} from 'nostr-tools'
  import {navigate} from "svelte-routing"
  import {liveQuery} from 'dexie'
  import {fuzzy} from "src/util/misc"
  import {getRelays, getPerson, listen, db} from 'src/agent'
  import {modal} from 'src/app'
  import loaders from 'src/app/loaders'
  import Room from "src/partials/Room.svelte"
  import Input from "src/partials/Input.svelte"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Anchor from "src/partials/Anchor.svelte"

  let q = ""
  let roomsCount = 0

  const rooms = liveQuery(async () => {
    const [rooms, messages] = await Promise.all([
      db.rooms.where('joined').equals(1).toArray(),
      db.messages.toArray(),
    ])

    const pubkeys = uniq(pluck('pubkey', messages))
    await loaders.loadPeople(getRelays(), pubkeys)

    return pubkeys
      .map(k => ({type: 'npub', id: k, ...getPerson(k, true)}))
      .concat(rooms.map(room => ({type: 'note', ...room})))
  })

  const search = liveQuery(async () => {
    const rooms = await db.rooms.where('joined').equals(0).toArray()

    roomsCount = rooms.length

    return fuzzy(rooms, {keys: ["name", "about"]})
  })

  const setRoom = ({type, id}) => {
    if (type === 'npub') {
      navigate(`/messages/${nip19.npubEncode(id)}`)
    }

    if (type === 'note') {
      navigate(`/chat/${nip19.noteEncode(id)}`)
    }
  }

  const joinRoom = id => {
    db.rooms.where('id').equals(id).modify({joined: 1})
  }

  const leaveRoom = id => {
    db.rooms.where('id').equals(id).modify({joined: 0})
  }

  onMount(() => {
    const sub = listen(getRelays(), {kinds: [40, 41]})

    return () => {
      sub.then(s => {
        s.unsub()
      })
    }
  })
</script>

{#if $rooms}
<Content>
  <div class="flex justify-between">
    <div class="flex gap-2 items-center">
      <i class="fa fa-server fa-lg" />
      <h2 class="staatliches text-2xl">Your rooms</h2>
    </div>
    <Anchor type="button-accent" on:click={() => modal.set({type: 'room/edit'})}>
      <i class="fa-solid fa-plus" /> Create Room
    </Anchor>
  </div>
  {#each ($rooms || []) as room (room.id)}
  <Room joined {room} {setRoom} {joinRoom} {leaveRoom} />
  {:else}
  <p class="text-center py-8">You haven't yet joined any rooms.</p>
  {/each}
  <div class="pt-2 mb-2 border-b border-solid border-medium" />
  <div class="flex gap-2 items-center">
    <i class="fa fa-globe fa-lg" />
    <h2 class="staatliches text-2xl">Other rooms</h2>
  </div>
  <div class="flex-grow">
    <Input bind:value={q} type="text" placeholder="Search rooms">
      <i slot="before" class="fa-solid fa-search" />
    </Input>
  </div>
  {#each $search ? $search(q).slice(0, 50) : [] as room (room.id)}
  <Room {room} {setRoom} {joinRoom} {leaveRoom} />
  {:else}
  <Spinner />
  {/each}
  <small class="text-center">
    Showing {Math.min(50, roomsCount)} of {roomsCount} known rooms
  </small>
</Content>
{:else}
<Spinner />
{/if}
