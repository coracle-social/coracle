<script lang="ts">
  import {reverse} from "ramda"
  import type {HistoryItem} from "src/util/router"
  import {decodeQueryString, decodeRouteParams} from "src/util/router"
  import Modal from "src/partials/Modal.svelte"
  import {menuIsOpen} from "src/app/state"
  import {router} from "src/app/router"

  const {page, modal, modals} = router

  const closeModal = async () => {
    router.pop()
    menuIsOpen.set(false)
  }

  const getProps = (item: HistoryItem) => ({
    ...item.config.context,
    ...decodeQueryString(item),
    ...decodeRouteParams(item),
  })

  $: {
    if ($modal) {
      console.log("modal", $modal, getProps($modal))
    } else {
      console.log("page", $page, getProps($page))
    }
  }
</script>

<div class="pt-16 text-gray-2 lg:ml-48" class:pointer-events-none={$menuIsOpen}>
  {#if $page}
    {#key $page.path}
      <svelte:component this={$page.route.component} {...getProps($page)} />
    {/key}
  {/if}
</div>

{#each reverse($modals).filter(m => !m.config.virtual) as m, i (m.path + i)}
  <Modal
    index={i}
    virtual={false}
    isOnTop={m === $modal}
    onEscape={m.config.noEscape ? null : closeModal}>
    <svelte:component this={m.route.component} {...getProps(m)} />
  </Modal>
{/each}
