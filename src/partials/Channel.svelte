<script>
  import cx from 'classnames'
  import {onMount} from 'svelte'
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {prop, path as getPath, reverse, uniqBy, sortBy, last} from 'ramda'
  import {formatTimestamp, sleep, createScroller, Cursor} from 'src/util/misc'
  import Badge from 'src/partials/Badge.svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import Spinner from 'src/partials/Spinner.svelte'
  import user from 'src/agent/user'
  import database from 'src/agent/database'
  import {renderNote} from 'src/app'

  export let name
  export let link = null
  export let about
  export let picture
  export let loadMessages
  export let listenForMessages
  export let sendMessage
  export let editRoom = null
  export let type

  let textarea
  let messages = []
  let loading = sleep(30_000)
  let annotatedMessages = []
  let showNewMessages = false
  let cursor = new Cursor()

  const {profile} = user

  $: {
    // Group messages so we're only showing the person once per chunk
    annotatedMessages = reverse(sortBy(prop('created_at'), uniqBy(prop('id'), messages)).reduce(
      (mx, m) => {
        const person = database.getPersonWithFallback(m.pubkey)
        const showPerson = person.pubkey !== getPath(['person', 'pubkey'], last(mx))

        return mx.concat({...m, person, showPerson})
      },
      []
    ))
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

  onMount(async () => {
    if (!$profile) {
      return navigate('/login')
    }

    const sub = await listenForMessages(
      newMessages => stickToBottom('smooth', () => {
        loading = sleep(30_000)
        messages = messages.concat(newMessages)
      })
    )

    const scroller = await createScroller(
      async () => {
        await loadMessages(cursor, events => {
          cursor.onChunk(events)

          stickToBottom('auto', () => {
            loading = sleep(30_000)
            messages = events.concat(messages)
          })
        })
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
    <div class="flex flex-col pt-20 pb-28 h-full">
      <ul class="pb-6 p-4 overflow-auto flex-grow flex flex-col-reverse justify-start channel-messages">
        {#each annotatedMessages as m (m.id)}
          <li in:fly={{y: 20}} class="py-1 flex flex-col gap-2">
            {#if type === 'chat' && m.showPerson}
            <div class="flex gap-4 items-center justify-between">
              <Badge person={m.person} />
              <p class="text-sm text-light">{formatTimestamp(m.created_at)}</p>
            </div>
            {/if}
            <div class={cx("flex overflow-hidden text-ellipsis", {
              'ml-12 justify-end': type === 'dm' && m.person.pubkey === $profile.pubkey,
              'mr-12': type === 'dm' && m.person.pubkey !== $profile.pubkey,
            })}>
              <div class={cx({
                'ml-6': type === 'chat',
                'rounded-2xl py-2 px-4 flex max-w-xl': type === 'dm',
                'bg-light text-black rounded-br-none': type === 'dm' && m.person.pubkey === $profile.pubkey,
                'bg-dark rounded-bl-none': type === 'dm' && m.person.pubkey !== $profile.pubkey,
              })}>
                {@html renderNote(m, {showEntire: true})}
              </div>
            </div>
          </li>
        {/each}
        {#await loading}
        <Spinner>Looking for messages...</Spinner>
        {:then}
        <div in:fly={{y: 20}} class="text-center py-20">End of message history</div>
        {/await}
      </ul>
    </div>
    <div class="fixed z-20 top-0 w-full lg:-ml-56 lg:pl-56 border-b border-solid border-medium bg-dark">
      <div class="p-4 flex items-start gap-4">
        <div class="flex items-center gap-4">
          <button
            class="fa fa-arrow-left text-2xl cursor-pointer"
            on:click={() => navigate("/chat")} />
          <div
            class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
            style="background-image: url({picture})" />
        </div>
        <div class="w-full flex flex-col gap-2">
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-4">
              {#if link}
              <Anchor type="unstyled" href={link} class="text-lg font-bold">{name || ''}</Anchor>
              {:else}
              <div class="text-lg font-bold">{name || ''}</div>
              {/if}
              {#if editRoom}
              <button class="text-sm cursor-pointer" on:click={editRoom}>
                <i class="fa-solid fa-edit" /> Edit
              </button>
              {/if}
            </div>
            <div class="flex items-center gap-2">
              {#if type === 'dm'}
                <i class="fa fa-lock text-light" />
                <span class="text-light">Encrypted</span>
              {:else}
                <i class="fa fa-lock-open text-light" />
                <span class="text-light">Public</span>
              {/if}
            </div>
          </div>
          <div>{about || ''}</div>
        </div>
      </div>
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

