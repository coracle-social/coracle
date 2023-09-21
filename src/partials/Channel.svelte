<script lang="ts">
  import {onDestroy, onMount} from "svelte"
  import {sleep} from "hurdak"
  import {prop, max, reverse, pluck, sortBy, last} from "ramda"
  import {writable} from "svelte/store"
  import {fly} from "src/util/transition"
  import {createScroller} from "src/util/misc"
  import Spinner from "src/partials/Spinner.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import type {Event} from "src/engine"
  import {canSign} from "src/engine"

  export let messages: Event[]
  export let sendMessage

  let textarea
  let container
  let scroller
  let limit = writable(10)
  let loading = sleep(30_000)
  let showNewMessages = false
  let groupedMessages = []

  onMount(() => {
    scroller = createScroller(async () => limit.update(l => l + 10), {
      element: container,
      reverse: true,
    })
  })

  onDestroy(() => {
    scroller.stop()
  })

  const scrollToBottom = () => {
    container.scrollIntoView({behavior: "smooth", block: "end"})
  }

  const stickToBottom = async () => {
    const lastMessage = pluck("created_at", groupedMessages).reduce(max, 0)
    const shouldStick = container?.scrollTop > -200

    if (shouldStick) {
      scrollToBottom()
    } else if (lastMessage < pluck("created_at", groupedMessages).reduce(max, 0)) {
      showNewMessages = true
    }
  }

  const addImage = url => {
    textarea.value = (textarea.value + "\n\n" + url).trim()
  }

  const send = async () => {
    const content = textarea.value.trim()

    if (content) {
      textarea.value = ""

      await sendMessage(content)

      stickToBottom()
    }
  }

  const onKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  // Group messages so we're only showing the person once per chunk
  $: {
    if (groupedMessages?.length === messages.length) {
      scroller?.stop()
    }

    const result = reverse(
      sortBy(prop("created_at"), messages).reduce((mx, m) => {
        return mx.concat({...m, showProfile: m.pubkey !== last(mx)?.pubkey})
      }, [])
    )

    setTimeout(stickToBottom, 100)

    groupedMessages = result.slice(0, $limit) as (Event & {showProfile: boolean})[]
  }
</script>

<svelte:window
  on:scroll={() => {
    showNewMessages = false
  }} />

<div class="flex h-full gap-4">
  <div class="relative w-full">
    <div class="-mt-16 flex h-screen flex-col pt-20" class:pb-20={$canSign}>
      <ul
        bind:this={container}
        class="flex flex-grow flex-col-reverse justify-start overflow-auto p-4 pb-6">
        {#each groupedMessages as m (m.id)}
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
    <div
      class="fixed top-0 z-20 -mt-px w-full border-b border-solid border-gray-6 bg-gray-7 lg:pr-48">
      <slot name="header" />
    </div>
    {#if $canSign}
      <div
        class="fixed bottom-0 z-10 flex w-full border-t border-solid border-gray-6 border-gray-7 bg-gray-6 lg:-ml-48 lg:pl-48">
        <textarea
          rows="3"
          autofocus
          placeholder="Type something..."
          bind:this={textarea}
          on:keydown={onKeyDown}
          class="w-full resize-none bg-gray-6 p-2
               text-gray-2 outline-0 placeholder:text-gray-1" />
        <div>
          <ImageInput onChange={addImage}>
            <button
              slot="button"
              class="flex cursor-pointer flex-col justify-center gap-2 border-l border-solid border-gray-7 p-3
                   py-6 text-gray-2 transition-all hover:bg-accent">
              <i class="fa-solid fa-paperclip fa-lg" />
            </button>
          </ImageInput>
          <button
            on:click={send}
            class="flex cursor-pointer flex-col justify-center gap-2 border-l border-solid border-gray-7 p-3
                 py-6 text-gray-2 transition-all hover:bg-accent">
            <i class="fa-solid fa-paper-plane fa-lg" />
          </button>
        </div>
      </div>
    {/if}
  </div>
  {#if showNewMessages}
    <div
      class="fixed bottom-32 flex w-full cursor-pointer justify-center"
      transition:fly|local={{y: 20}}
      on:click={scrollToBottom}>
      <div class="rounded-full bg-accent px-4 py-2 text-gray-2">New messages found</div>
    </div>
  {/if}
</div>
