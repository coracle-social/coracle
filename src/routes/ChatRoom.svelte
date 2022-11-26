<script>
  import {onMount} from 'svelte'
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {prop, last} from 'ramda'
  import {switcherFn} from 'hurdak/src/core'
  import UserBadge from 'src/partials/UserBadge.svelte'
  import {channels} from 'src/state/nostr'
  import {rooms, accounts, ensureAccount} from 'src/state/app'
  import {dispatch} from 'src/state/dispatch'
  import {user} from 'src/state/user'
  import RoomList from "src/partials/chat/RoomList.svelte"

  export let room

  let textarea
  let messages = []
  let annotatedMessages = []

  $: {
    // Group messages so we're only showing the account once per chunk
    annotatedMessages = messages.reduce(
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
    )
  }

  onMount(() => {
    const isVisible = $el => {
      const bodyRect = document.body.getBoundingClientRect()
      const {top, height} = $el.getBoundingClientRect()

      return top + height < bodyRect.height
    }

    channels.main.sub({
      filter: {kinds: [42, 43, 44], '#e': [room]},
      cb: e => {
        switcherFn(e.kind, {
          42: () => {
            messages = messages.concat(e)

            ensureAccount(e.pubkey)

            const $prevListItem = last(document.querySelectorAll('.chat-message'))

            if ($prevListItem && isVisible($prevListItem)) {
              setTimeout(() => {
                const $li = last(document.querySelectorAll('.chat-message'))

                $li.scrollIntoView({behavior: "smooth"})
              }, 100)
            }
          },
          43: () => null,
          44: () => null,
        })
      },
    })
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


<div class="flex gap-4 h-full">
  <div class="sm:ml-56 w-full">
    <div class="relative">
      <div class="flex flex-col pt-20 pb-32">
        <ul class="p-4 max-h-full flex-grow">
          {#each annotatedMessages as m}
            <li in:fly={{y: 20}} class="py-1 chat-message">
              {#if m.showAccount}
              <UserBadge user={m.account} />
              {/if}
              <div class="ml-6">{m.content}</div>
            </li>
          {/each}
        </ul>
      </div>
      {#if $rooms[room]}
      <div class="fixed top-0 pt-20 w-full -ml-56 pl-60 p-4 border-b border-solid border-medium bg-dark flex gap-4">
        <div
          class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
          style="background-image: url({$rooms[room].picture})" />
        <div class="w-full">
          <div class="flex items-center justify-between w-full">
            <div class="text-lg font-bold">{$rooms[room].name}</div>
            {#if $rooms[room].pubkey === $user.pubkey}
            <small class="cursor-pointer" on:click={edit}>
              <i class="fa-solid fa-edit" /> Edit
            </small>
            {/if}
          </div>
          <div>{$rooms[room].about || ''}</div>
        </div>
      </div>
      {/if}
      <div class="fixed bottom-0 w-full -ml-56 pl-56 flex bg-medium border-medium border-t border-solid border-dark">
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
  <RoomList />
</div>

