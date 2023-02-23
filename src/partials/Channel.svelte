<script>
  import {onMount} from 'svelte'
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {prop, path as getPath, reverse, pluck, uniqBy, sortBy, last} from 'ramda'
  import {sleep, createScroller, Cursor} from 'src/util/misc'
  import Spinner from 'src/partials/Spinner.svelte'
  import user from 'src/agent/user'
  import database from 'src/agent/database'
  import network from 'src/agent/network'

  export let loadMessages
  export let listenForMessages
  export let sendMessage

  let textarea
  let messages = []
  let loading = sleep(30_000)
  let annotatedMessages = []
  let showNewMessages = false
  let cursor = new Cursor()

  const {profile} = user

  $: {
    // Group messages so we're only showing the person once per chunk
    annotatedMessages = reverse(
      sortBy(prop('created_at'), uniqBy(prop('id'), messages)).reduce(
        (mx, m) => {
          const person = database.getPersonWithFallback(m.pubkey)
          const showPerson = person.pubkey !== getPath(['person', 'pubkey'], last(mx))

          return mx.concat({...m, person, showPerson})
        },
        []
      )
    )
  }

  // flex-col means the first is the last
  const getLastListItem = () => document.querySelector('ul[class=channel-messages] li')

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

  onMount(() => {
    if (!$profile) {
      return navigate('/login')
    }

    const sub = listenForMessages(
      newMessages => stickToBottom('smooth', () => {
        loading = sleep(30_000)
        messages = messages.concat(newMessages)
        network.loadPeople(pluck('pubkey', newMessages))
      })
    )

    const scroller = createScroller(
      async () => {
        await loadMessages(cursor, newMessages => {
          cursor.onChunk(newMessages)

          stickToBottom('auto', () => {
            loading = sleep(30_000)
            messages = sortBy(e => -e.created_at, newMessages.concat(messages))
            network.loadPeople(pluck('pubkey', newMessages))
          })
        })
      },
      {reverse: true}
    )

    return () => {
      scroller.stop()
      sub.then(s => s?.unsub())
    }
  })

  const send = async () => {
    const content = textarea.value.trim()

    if (content) {
      textarea.value = ''

      const event = await sendMessage(content)

      stickToBottom('smooth', () => {
        messages = sortBy(e => -e.created_at, [event].concat(messages))
      })
    }
  }

  const onKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }
</script>

<svelte:window on:scroll={() => { showNewMessages = false}} />

<div class="flex gap-4 h-full">
  <div class="relative w-full">
    <div class="flex flex-col py-18 pb-20 h-full">
      <ul class="pb-6 p-4 overflow-auto flex-grow flex flex-col-reverse justify-start channel-messages">
        {#each annotatedMessages as m (m.id)}
          <li in:fly={{y: 20}} class="py-1 flex flex-col gap-2">
            <slot name="message" message={m} />
          </li>
        {/each}
        {#await loading}
        <Spinner>Looking for messages...</Spinner>
        {:then}
        <div in:fly={{y: 20}} class="text-center py-20">End of message history</div>
        {/await}
      </ul>
    </div>
    <div class="fixed z-20 top-0 w-full lg:-ml-56 lg:pl-56 border-b border-solid
                border-medium bg-dark p-4">
      <slot name="header" />
    </div>
    <div class="fixed z-10 bottom-0 w-full flex bg-medium border-medium border-t border-solid border-dark lg:-ml-56 lg:pl-56">
      <textarea
        rows="3"
        autofocus
        placeholder="Type something..."
        bind:this={textarea}
        on:keypress={onKeyPress}
        class="w-full p-2 text-white bg-medium
               placeholder:text-light outline-0 resize-none" />
      <button
        on:click={send}
        class="flex flex-col py-8 p-4 justify-center gap-2 border-l border-solid border-dark
               hover:bg-accent transition-all cursor-pointer text-white ">
        <i class="fa-solid fa-paper-plane fa-xl" />
      </button>
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

