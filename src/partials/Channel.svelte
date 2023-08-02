<script>
  import {onDestroy} from "svelte"
  import {sleep} from "hurdak"
  import {prop, max, path as getPath, reverse, pluck, sortBy, last} from "ramda"
  import {writable, derived} from "svelte/store"
  import {fly} from "src/util/transition"
  import {createScroller} from "src/util/misc"
  import Spinner from "src/partials/Spinner.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import {Keys, Directory} from "src/app/engine"

  export let messages
  export let sendMessage

  let textarea
  let limit = writable(5)
  let loading = sleep(30_000)
  let showNewMessages = false

  onDestroy(() => {
    scroller.stop()
  })

  const scroller = createScroller(() => limit.update(l => l + 5), {reverse: true})

  // flex-reverse-col means the first is the last
  const getLastListItem = () => document.querySelector("ul.channel-messages li")

  const scrollToBottom = () => {
    getLastListItem()?.scrollIntoView({behavior: "smooth"})
  }

  const stickToBottom = async cb => {
    const lastMessage = pluck("created_at", $groupedMessages).reduce(max, 0)
    const $channelMessages = document.querySelector(".channel-messages")
    const shouldStick = $channelMessages?.scrollTop > -200

    await cb?.()

    if (shouldStick) {
      scrollToBottom()
    } else if (lastMessage < pluck("created_at", $groupedMessages).reduce(max, 0)) {
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

  const onKeyPress = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  // Group messages so we're only showing the person once per chunk
  const groupedMessages = derived([messages], ([$messages, $limit]) => {
    const result = reverse(
      sortBy(prop("created_at"), $messages).reduce((mx, m) => {
        const profile = Directory.getProfile(m.pubkey)
        const showProfile = profile.pubkey !== getPath(["profile", "pubkey"], last(mx))

        return mx.concat({...m, profile, showProfile})
      }, [])
    )

    setTimeout(stickToBottom, 100)

    return result.slice(0, $limit)
  })
</script>

<svelte:window
  on:scroll={() => {
    showNewMessages = false
  }} />

<div class="flex h-full gap-4">
  <div class="relative w-full">
    <div class="-mt-16 flex h-screen flex-col pt-20" class:pb-20={Keys.canSign.get()}>
      <ul
        class="channel-messages flex flex-grow flex-col-reverse justify-start overflow-auto p-4 pb-6">
        {#each $groupedMessages as m (m.id)}
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
    {#if Keys.canSign.get()}
      <div
        class="fixed bottom-0 z-10 flex w-full border-t border-solid border-gray-6 border-gray-7 bg-gray-6 lg:-ml-48 lg:pl-48">
        <textarea
          rows="3"
          autofocus
          placeholder="Type something..."
          bind:this={textarea}
          on:keypress={onKeyPress}
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
