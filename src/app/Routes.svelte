<script lang="ts">
  import {reverse} from "ramda"
  import logger from "src/util/logger"
  import {getProps, getKey} from "src/util/router"
  import Modal from "src/partials/Modal.svelte"
  import {menuIsOpen} from "src/app/state"
  import {router} from "src/app/router"
  import {session, signer, stateKey} from "src/engine"

  const {current, page, modal, modals} = router

  $: {
    if ($modal) {
      logger.info("modal", $modal, getProps($modal))
    }
  }

  $: {
    if ($page) {
      window.scrollTo(0, 0)

      logger.info("page", $page, getProps($page))
    }
  }

  $: {
    // Redirect if we have no user
    if (!$session && $page?.route.requireUser) {
      router.go("/", {replace: true})
    }

    // Redirect if we need a signer
    if (!$signer.isEnabled() && $page?.route.requireSigner) {
      router.go("/", {replace: true})
    }

    const props = getProps($current)

    // Redirect if we're missing required parameters.
    // This is usually due to a malformed url.
    for (const k of $current.route.required || []) {
      if (!props[k]) {
        router.go("/", {replace: true})
        break
      }
    }
  }
</script>

{#key $stateKey}
  <div
    id="page"
    class="relative pb-24 text-neutral-100 lg:ml-60 lg:pt-16"
    class:pointer-events-none={$menuIsOpen}>
    {#if $page}
      {#key getKey($page)}
        <div class="m-auto flex w-full max-w-2xl flex-grow flex-col gap-8 p-4">
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
