<script>
  import {onMount} from 'svelte'
  import {liveQuery} from 'dexie'
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {prop, path as getPath, pluck, reverse, uniqBy, sortBy, last} from 'ramda'
  import {formatTimestamp, now, createScroller, batch, Cursor} from 'src/util/misc'
  import Badge from 'src/partials/Badge.svelte'
  import Spinner from 'src/partials/Spinner.svelte'
  import {user, getPerson, getRelays, db, listen, load} from 'src/agent'
  import {render, modal} from 'src/app'
  import loaders from 'src/app/loaders'
  import cmd from 'src/app/cmd'

  export let roomId

  let textarea
  let messages = []
  let annotatedMessages = []
  let showNewMessages = false
  let room = liveQuery(() => db.rooms.where('id').equals(roomId).first())
  let cursor = new Cursor()

  $: {
    // Group messages so we're only showing the person once per chunk
    annotatedMessages = reverse(sortBy(prop('created_at'), uniqBy(prop('id'), messages)).reduce(
      (mx, m) => {
        const person = getPerson(m.pubkey, true)
        const showPerson = person.pubkey !== getPath(['person', 'pubkey'], last(mx))

        return mx.concat({...m, person, showPerson})
      },
      []
    ))
  }

  // flex-col means the first is the last
  const getLastListItem = () => document.querySelector('ul[name=messages] li')

  const stickToBottom = async (behavior, cb) => {
    const shouldStick = window.scrollY + window.innerHeight > document.body.scrollHeight - 200

    await cb()

    if (shouldStick) {
      const $li = getLastListItem()

      if ($li) {
        $li.scrollIntoView({behavior})
      }
    } else {
      showNewMessages = true
    }
  }

  onMount(async () => {
    if (!$user) {
      return navigate('/login')
    }

    const sub = listen(
      getRelays(),
      // Listen for updates to the room in case we didn't get them before
      [{kinds: [40, 41], ids: [roomId]},
       {kinds: [42], '#e': [roomId], since: now()}],
      batch(300, events => {
        const newMessages = events.filter(e => e.kind === 42)

        loaders.loadPeople(getRelays(), pluck('pubkey', events))

        stickToBottom('smooth', () => {
          messages = messages.concat(newMessages)
        })
      })
    )

    const scroller = createScroller(
      async () => {
        const {until, limit} = cursor
        const events = await load(getRelays(), {kinds: [42], '#e': [roomId], until, limit})

        if (events.length) {
          cursor.onChunk(events)

          await loaders.loadPeople(getRelays(), pluck('pubkey', events))

          stickToBottom('auto', () => {
            messages = events.concat(messages)
          })
        }
      },
      {reverse: true}
    )

    return async () => {
      const {unsub} = await sub

      scroller.stop()
      unsub()
    }
  })

  const edit = () => {
    modal.set({form: 'room/edit', room: $room})
  }

  const sendMessage = async () => {
    const content = textarea.value.trim()

    if (content) {
      textarea.value = ''

      const event = await cmd.createMessage(getRelays(), roomId, content)

      stickToBottom('smooth', () => {
        messages = [event].concat(messages)
      })
    }
  }

  const onKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
</script>

<svelte:window on:scroll={() => { showNewMessages = false}} />

<div class="flex gap-4 h-full">
  <div class="relative w-full">
    <div class="flex flex-col py-32">
      <ul class="p-4 max-h-full flex-grow flex flex-col-reverse" name="messages">
        {#each annotatedMessages as m (m.id)}
          <li in:fly={{y: 20}} class="py-1 flex flex-col gap-2">
            {#if m.showPerson}
            <div class="flex gap-4 items-center justify-between">
              <Badge person={m.person} />
              <p class="text-sm text-light">{formatTimestamp(m.created_at)}</p>
            </div>
            {/if}
            <div class="ml-6 overflow-hidden text-ellipsis">
              {@html render(m, {showEntire: true})}
            </div>
          </li>
        {/each}
        <Spinner>Looking for messages...</Spinner>
        <div class="h-64" />
      </ul>
    </div>
    <div class="fixed z-10 top-0 pt-20 w-full p-4 border-b border-solid border-medium bg-dark flex gap-4">
      <div
        class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
        style="background-image: url({$room?.picture})" />
      <div class="w-full">
        <div class="flex items-center justify-between w-full">
          <div class="text-lg font-bold">{$room?.name || ''}</div>
          {#if $room?.pubkey === $user?.pubkey}
          <small class="cursor-pointer" on:click={edit}>
            <i class="fa-solid fa-edit" /> Edit
          </small>
          {/if}
        </div>
        <div>{$room?.about || ''}</div>
      </div>
    </div>
    <div class="fixed z-10 bottom-0 w-full flex bg-medium border-medium border-t border-solid border-dark">
      <textarea
        rows="4"
        autofocus
        placeholder="Type something..."
        bind:this={textarea}
        on:keypress={onKeyPress}
        class="w-full p-2 text-white bg-medium
               placeholder:text-light outline-0 resize-none" />
      <div
        on:click={sendMessage}
        class="flex flex-col py-8 p-4 justify-center gap-2 border-l border-solid border-dark
               hover:bg-accent transition-all cursor-pointer text-white ">
        <i class="fa-solid fa-paper-plane fa-xl" />
      </div>
    </div>
  </div>
  {#if showNewMessages}
  <div class="fixed w-full flex justify-center bottom-32" transition:fly|local={{y: 20}}>
    <div class="rounded-full bg-accent text-white py-2 px-4">
      New messages found
    </div>
  </div>
  {/if}
</div>

