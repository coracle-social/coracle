<script lang="ts">
  import {sortBy} from "ramda"
  import {slide} from "svelte/transition"
  import Media from "src/partials/Media.svelte"
  import Content from "src/partials/Content.svelte"
  import Modal from "src/partials/Modal.svelte"

  export let links
  export let onClose = null

  let hidden = false
  let showModal = false

  // Put previews last since we need to load them asynchronously
  const annotated = sortBy(
    ({type}) => (type === "preview" ? 1 : 0),
    links
      .filter(url => !url.startsWith("ws"))
      .map(url => {
        if (url.match(".(jpg|jpeg|png|gif)")) {
          return {type: "image", url}
        } else if (url.match(".(mov|mp4)")) {
          return {type: "video", url}
        } else {
          return {type: "preview", url}
        }
      })
  )

  const close = () => {
    onClose?.()
    hidden = true
  }

  const openModal = () => {
    showModal = true
  }
  const closeModal = () => {
    showModal = false
  }
</script>

{#if !hidden}
  <div in:slide class="relative">
    <Media link={annotated[0]} onClose={close} />
    {#if annotated.length > 1}
      <p class="text-gray-500 py-4 text-center underline" on:click={openModal}>
        <i class="fa fa-plus" /> Show {annotated.length} link previews
      </p>
    {/if}
  </div>
{/if}

{#if showModal}
  <Modal onEscape={closeModal}>
    <Content>
      {#each annotated as link}
        <Media {link} />
      {/each}
    </Content>
  </Modal>
{/if}
