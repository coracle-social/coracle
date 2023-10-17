<script lang="ts">
  import {reverse} from "ramda"
  import {fly} from "src/util/transition"
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
    ...decodeRouteParams(item),
    ...decodeQueryString(item),
    ...item.config.context,
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
      <div in:fly={{y: 20}}>
        <svelte:component this={$page.route.component} {...getProps($page)} />
      </div>
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
