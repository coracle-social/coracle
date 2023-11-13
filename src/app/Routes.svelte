<script lang="ts">
  import {reverse} from "ramda"
  import {fly} from "src/util/transition"
  import {getProps, getKey} from "src/util/router"
  import Modal from "src/partials/Modal.svelte"
  import {menuIsOpen} from "src/app/state"
  import {router} from "src/app/router"
  import {session, stateKey} from "src/engine"

  const {page, modal, modals} = router

  const closeModal = async () => {
    router.pop()
    menuIsOpen.set(false)
  }

  $: {
    if ($modal) {
      console.log("modal", $modal, getProps($modal))
    } else if ($page) {
      console.log("page", $page, getProps($page))
    }
  }

  $: {
    if (!$session && $page?.route.requireUser) {
      router.go("/", {replace: true})
    }
  }
</script>

{#key $stateKey}
  <div class="pt-16 text-gray-2 lg:ml-48" class:pointer-events-none={$menuIsOpen}>
    {#if $page}
      {#key getKey($page)}
        <div in:fly={{y: 20}}>
          <svelte:component this={$page.route.component} {...getProps($page)} />
        </div>
      {/key}
    {/if}
  </div>
{/key}

{#each reverse($modals).filter(m => !m.config.virtual) as m, i (getKey(m) + i)}
  <Modal
    index={i}
    virtual={false}
    isOnTop={m === $modal}
    onEscape={m.config.noEscape ? null : closeModal}>
    {#key $stateKey}
      <svelte:component this={m.route.component} {...getProps(m)} />
    {/key}
  </Modal>
{/each}
