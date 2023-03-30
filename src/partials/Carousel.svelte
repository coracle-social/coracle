<script lang="ts">
  import {sortBy} from 'ramda'
  import {quantify} from 'hurdak/lib/hurdak'
  import {slide} from "svelte/transition"
  import CarouselItem from "src/partials/CarouselItem.svelte"
  import Content from "src/partials/Content.svelte"
  import Modal from "src/partials/Modal.svelte"

  export let links
  export let onClose = null

  let hidden = false
  let showModal = false

  // Put previews last since we need to load them asynchronously
  const annotated = sortBy(
    ({type}) => type === 'preview' ? 1 : 0,
    links
      .filter(url => !url.startsWith('ws'))
      .map(url => {
        if (url.match(".(jpg|jpeg|png|gif)")) {
          return {type: 'image', url}
        } else if (url.match(".(mov|mp4)")) {
          return {type: 'video', url}
        } else {
          return {type: 'preview', url}
        }
      })
  )

  const close = () => {
    onClose?.()
    hidden = true
  }

  const openModal = () => { showModal = true }
  const closeModal = () => { showModal = false }
</script>

{#if !hidden}
<div in:slide class="relative">
  <CarouselItem link={annotated[0]} showLoading={false} />
  <div
    on:click|preventDefault={close}
    class="absolute top-0 right-0 m-1 flex h-6 w-6 items-center justify-center
         rounded-full border border-solid border-gray-6 bg-white text-black opacity-50 shadow">
    <i class="fa fa-times" />
  </div>
  {#if annotated.length > 1}
  <p class="py-4 text-gray-500" on:click={openModal}>
    <i class="fa fa-plus" /> Show all {annotated.length} link previews
  </p>
  {/if}
</div>
{/if}

{#if showModal}
<Modal onEscape={closeModal}>
  <Content>
    {#each annotated as link}
    <CarouselItem {link} />
    {/each}
  </Content>
</Modal>
{/if}
