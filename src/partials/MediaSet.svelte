<script lang="ts">
  import {sortBy} from "ramda"
  import {annotateMedia} from "src/util/misc"
  import Media from "src/partials/Media.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Modal from "src/partials/Modal.svelte"

  export let links

  let showModal = false

  // Put previews last since we need to load them asynchronously
  const annotated = sortBy(
    (l: any) => (l.type === "preview" ? 1 : 0),
    links.map(link => annotateMedia(link.url))
  )

  const openModal = () => {
    showModal = true
  }

  const closeModal = () => {
    showModal = false
  }
</script>

<div class="my-8 flex justify-center">
  <Anchor theme="button-minimal" on:click={openModal}>
    <i class="fa fa-plus" /> Show all {annotated.length} link previews
  </Anchor>
</div>

{#if showModal}
  <Modal onEscape={closeModal}>
    <Content>
      {#each annotated as link}
        <Media {link} />
      {/each}
    </Content>
  </Modal>
{/if}
