<script>
  import {onMount} from "svelte"
  import {fly} from "svelte/transition"
  import {prop, max, path as getPath, reverse, pluck, uniqBy, sortBy, last} from "ramda"
  import {sleep, createScroller} from "src/util/misc"
  import Spinner from "src/partials/Spinner.svelte"
  import {getPersonWithFallback} from "src/agent/db"
  import network from "src/agent/network"
  import user from "src/agent/user"

  export let loadMessages
  export let listenForMessages
  export let sendMessage

  const {canPublish} = user

  let textarea
  let messages = []
  let loading = sleep(30_000)
  let annotatedMessages = []
  let showNewMessages = false

  $: {
    // Group messages so we're only showing the person once per chunk
    annotatedMessages = reverse(
      sortBy(prop("created_at"), messages).reduce((mx, m) => {
        const person = getPersonWithFallback(m.pubkey)
        const showPerson = person.pubkey !== getPath(["person", "pubkey"], last(mx))

        return mx.concat({...m, person, showPerson})
      }, [])
    )
  }

  // flex-reverse-col means the first is the last
  const getLastListItem = () => document.querySelector("ul.channel-messages li")

  const scrollToBottom = () => {
    getLastListItem()?.scrollIntoView({behavior: "smooth"})
  }

  const stickToBottom = async cb => {
    const lastMessage = pluck("created_at", annotatedMessages).reduce(max, 0)
    const $channelMessages = document.querySelector(".channel-messages")
    const shouldStick = $channelMessages?.scrollTop > -200

    await cb()

    if (shouldStick) {
      scrollToBottom()
    } else if (lastMessage < pluck("created_at", annotatedMessages).reduce(max, 0)) {
      showNewMessages = true
    }
  }

  onMount(() => {
    const sub = listenForMessages(newMessages =>
      stickToBottom(() => {
        loading = sleep(30_000)
        messages = uniqBy(prop("id"), messages.concat(newMessages))
        network.loadPeople(pluck("pubkey", newMessages))
      })
    )

    const scroller = createScroller(
      async () => {
        await loadMessages(newMessages => {
          stickToBottom(() => {
            loading = sleep(30_000)
            messages = sortBy(e => -e.created_at, uniqBy(prop("id"), newMessages.concat(messages)))
            network.loadPeople(pluck("pubkey", newMessages))
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
      textarea.value = ""

      const event = await sendMessage(content)

      stickToBottom(() => {
        messages = sortBy(e => -e.created_at, [event].concat(messages))
      })
    }
  }

  const onKeyPress = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }
</script>

<svelte:window
  on:scroll={() => {
    showNewMessages = false
  }} />

<div class="flex h-full gap-4">
  <div class="relative w-full">
    <div class="py-18 flex h-screen flex-col" class:pb-20={$canPublish}>
      <ul
        class="channel-messages flex flex-grow flex-col-reverse justify-start overflow-auto p-4 pb-6">
        {#each annotatedMessages as m (m.id)}
          <li in:fly={{y: 20}} class="flex flex-col gap-2 py-1">
            <slot name="message" message={m} />
          </li>
        {/each}
        {#await loading}
          <Spinner>Looking for messages...</Spinner>
        {:then}
          <div in:fly={{y: 20}} class="py-20 text-center">End of message history</div>
        {/await}
      </ul>
    </div>
    <div class="fixed top-0 z-20 w-full border-b border-solid border-gray-6 bg-gray-7">
      <slot name="header" />
    </div>
    {#if $canPublish}
      <div
        class="fixed bottom-0 z-10 flex w-full border-t border-solid border-gray-6 border-gray-7 bg-gray-6 lg:-ml-56 lg:pl-56">
        <textarea
          rows="3"
          autofocus
          placeholder="Type something..."
          bind:this={textarea}
          on:keypress={onKeyPress}
          class="w-full resize-none bg-gray-6 p-2
               text-gray-2 outline-0 placeholder:text-gray-1" />
        <button
          on:click={send}
          class="flex cursor-pointer flex-col justify-center gap-2 border-l border-solid border-gray-7 p-4
               py-8 text-gray-2 transition-all hover:bg-accent ">
          <i class="fa-solid fa-paper-plane fa-xl" />
        </button>
      </div>
    {/if}
  </div>
  {#if showNewMessages}
    <div
      class="fixed bottom-32 flex w-full cursor-pointer justify-center"
      transition:fly|local={{y: 20}}
      on:click={scrollToBottom}>
      <div class="rounded-full bg-accent py-2 px-4 text-gray-2">New messages found</div>
    </div>
  {/if}
</div>
