<script>
  import cx from 'classnames'
  import {onMount} from 'svelte'
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {prop, path as getPath, reverse, uniqBy, sortBy, last} from 'ramda'
  import {formatTimestamp, sleep, createScroller, Cursor} from 'src/util/misc'
  import Badge from 'src/partials/Badge.svelte'
  import Spinner from 'src/partials/Spinner.svelte'
  import {user, getPerson} from 'src/agent'
  import {render} from 'src/app'

  export let name
  export let about
  export let picture
  export let loadMessages
  export let listenForMessages
  export let sendMessage
  export let editRoom = null
  export let type
  console.log(editRoom)

  let textarea
  let messages = []
  let loading = sleep(10_000)
  let annotatedMessages = []
  let showNewMessages = false
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

    const sub = listenForMessages(
      newMessages => stickToBottom('smooth', () => {
        loading = sleep(10_000)
        messages = messages.concat(newMessages)
      })
    )

    const scroller = createScroller(
      async () => {
        const events = await loadMessages(cursor)

        if (events.length) {
          cursor.onChunk(events)

          stickToBottom('auto', () => {
            loading = sleep(10_000)
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

  const send = async () => {
    const content = textarea.value.trim()

    if (content) {
      textarea.value = ''

      const event = await sendMessage(content)

      stickToBottom('smooth', () => {
        messages = [event].concat(messages)
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
    <div class="flex flex-col py-32 h-full">
      <ul class="p-4 h-full flex-grow flex flex-col-reverse justify-start" name="messages">
        {#each annotatedMessages as m (m.id)}
          <li in:fly={{y: 20}} class="py-1 flex flex-col gap-2">
            {#if type === 'chat' && m.showPerson}
            <div class="flex gap-4 items-center justify-between">
              <Badge person={m.person} />
              <p class="text-sm text-light">{formatTimestamp(m.created_at)}</p>
            </div>
            {/if}
            <div class={cx("overflow-hidden text-ellipsis", {
              'ml-6': type === 'chat',
              'rounded-2xl py-2 px-4': type === 'dm',
              'ml-12 bg-light text-black rounded-br-none': type === 'dm' && m.person.pubkey === $user.pubkey,
              'mr-12 bg-dark rounded-bl-none': type === 'dm' && m.person.pubkey !== $user.pubkey,
            })}>
              {@html render(m, {showEntire: true})}
            </div>
          </li>
        {/each}
        {#await loading}
        <Spinner>Looking for messages...</Spinner>
        {/await}
      </ul>
    </div>
    <div class="fixed z-10 top-16 w-full lg:-ml-56 lg:pl-56 border-b border-solid border-medium bg-dark">
      <div class="p-4 flex gap-4">
        <div
          class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
          style="background-image: url({picture})" />
        <div class="w-full">
          <div class="flex items-center justify-between w-full">
            <div class="text-lg font-bold">{name || ''}</div>
            {#if editRoom}
            <small class="cursor-pointer" on:click={editRoom}>
              <i class="fa-solid fa-edit" /> Edit
            </small>
            {/if}
          </div>
          <div>{about || ''}</div>
        </div>
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
        on:click={send}
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

