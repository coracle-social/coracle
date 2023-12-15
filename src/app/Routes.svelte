<script lang="ts">
  import {reverse} from "ramda"
  import {getProps, getKey} from "src/util/router"
  import Modal from "src/partials/Modal.svelte"
  import {menuIsOpen} from "src/app/state"
  import {router} from "src/app/router"
  import {session, stateKey} from "src/engine"

  const {page, modal, modals} = router

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
  <div
    class="relative pb-24 text-lightest lg:ml-60 lg:pt-16"
    class:pointer-events-none={$menuIsOpen}>
    {#if $page}
      {#key getKey($page)}
        <div class="m-auto flex w-full max-w-2xl flex-grow flex-col gap-4 overflow-x-hidden p-4">
          <svelte:component this={$page.route.component} {...getProps($page)} />
        </div>
      {/key}
    {/if}
  </div>
{/key}

{#each reverse($modals).filter(m => !m.config.virtual) as m, i (getKey(m) + i)}
  <Modal virtual={false} canClose={!m.config.noEscape}>
    {#key $stateKey}
      <svelte:component this={m.route.component} {...getProps(m)} />
    {/key}
  </Modal>
{/each}
