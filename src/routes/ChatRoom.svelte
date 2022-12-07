<script>
  import {onMount, onDestroy} from 'svelte'
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {prop, uniq, pluck, reverse, uniqBy, sortBy, last} from 'ramda'
  import {formatTimestamp} from 'src/util/misc'
  import {toHtml} from 'src/util/html'
  import UserBadge from 'src/partials/UserBadge.svelte'
  import {Listener, Cursor, epoch} from 'src/state/nostr'
  import {accounts, createScroller, ensureAccounts} from 'src/state/app'
  import {dispatch} from 'src/state/dispatch'
  import {user} from 'src/state/user'
  import RoomList from "src/partials/chat/RoomList.svelte"

  export let room

  let cursor
  let listener
  let scroller
  let textarea
  let messages = []
  let annotatedMessages = []
  let roomData = {id: room}

  $: {
    // Group messages so we're only showing the account once per chunk
    annotatedMessages = reverse(sortBy(prop('created_at'), uniqBy(prop('id'), messages)).reduce(
      (mx, m) => {
        const account = $accounts[m.pubkey]

        // If we don't have an account yet, don't show the message
        if (!account) {
          return mx
        }

        return mx.concat({
          ...m,
          account,
          showAccount: account !== prop('account', last(mx)),
        })
      },
      []
    ))
  }

  onMount(async () => {
    if (!$user) {
      return navigate('/login')
    }

    // flex-col means the first is the last
    const getLastListItem = () => document.querySelector('ul[name=messages] li')

    const stickToBottom = async (behavior, cb) => {
      const shouldStick = window.scrollY + window.innerHeight > document.body.scrollHeight - 200
      const $li = getLastListItem()

      await cb()

      if ($li && shouldStick) {
        $li.scrollIntoView({behavior})
      }
    }

    cursor = new Cursor({kinds: [42], '#e': [room]})
    scroller = createScroller(
      cursor,
      chunk => {
        stickToBottom('auto', async () => {
          for (const e of chunk) {
            messages = messages.concat(e)
          }

          if (chunk.length > 0) {
            await ensureAccounts(uniq(pluck('pubkey', chunk)))
          }
        })
      },
      {reverse: true}
    )

    listener = new Listener(
      [{kinds: [40, 41], ids: [room], since: epoch},
       {kinds: [42], '#e': [room]}],
      e => {
        const {pubkey, kind, content} = e

        if ([40, 41].includes(kind)) {
          roomData = {pubkey, ...roomData, ...JSON.parse(content)}
        } else {
          stickToBottom('smooth', async () => {
            messages = messages.concat(e)

            await ensureAccounts([e.pubkey])
          })
        }
      }
    )

    scroller.start()
    listener.start()
  })

  onDestroy(() => {
    cursor?.stop()
    listener?.stop()
    scroller?.stop()
  })

  const edit = () => {
    navigate(`/chat/${room}/edit`)
  }

  const sendMessage = () => {
    const content = textarea.value.trim()

    if (content) {
      textarea.value = ''

      dispatch("message/create", room, content)
    }
  }

  const onKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
</script>

<svelte:window on:scroll={scroller?.start} />

<div class="flex gap-4 h-full">
  <div class="sm:ml-56 w-full">
    <div class="relative">
      <div class="flex flex-col py-32">
        <ul class="p-4 max-h-full flex-grow flex flex-col-reverse" name="messages">
          {#each annotatedMessages as m (m.id)}
            <li in:fly={{y: 20}} class="py-1">
              {#if m.showAccount}
              <div class="flex gap-4 items-center justify-between">
                <UserBadge user={m.account} />
                <p class="text-sm text-light">{formatTimestamp(m.created_at)}</p>
              </div>
              {/if}
              <div class="ml-6">{@html toHtml(m.content)}</div>
            </li>
          {/each}
        </ul>
      </div>
      <div class="fixed top-0 pt-20 w-full sm:-ml-56 sm:pl-60 p-4 border-b border-solid border-medium bg-dark flex gap-4">
        <div
          class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
          style="background-image: url({roomData.picture})" />
        <div class="w-full">
          <div class="flex items-center justify-between w-full">
            <div class="text-lg font-bold">{roomData.name || ''}</div>
            {#if roomData.pubkey === $user?.pubkey}
            <small class="cursor-pointer" on:click={edit}>
              <i class="fa-solid fa-edit" /> Edit
            </small>
            {/if}
          </div>
          <div>{roomData.about || ''}</div>
        </div>
      </div>
      <div class="fixed bottom-0 w-full sm:-ml-56 sm:pl-56 flex bg-medium border-medium border-t border-solid border-dark">
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
  </div>
  <RoomList className="hidden sm:flex" />
</div>

