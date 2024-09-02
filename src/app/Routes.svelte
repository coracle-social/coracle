<script lang="ts">
  import cx from "classnames"
  import {reverse} from "ramda"
  import {signer, pubkey} from "@welshman/app"
  import logger from "src/util/logger"
  import Modal from "src/partials/Modal.svelte"
  import {menuIsOpen} from "src/app/state"
  import {router} from "src/app/util/router"

  const {current, page, modal, modals} = router

  let prevPage

  $: {
    if ($modal) {
      logger.info("modal", $modal, router.getProps($modal))
    }
  }

  $: {
    if ($page) {
      logger.info("page", $page, router.getProps($page))

      if ($page.path !== prevPage?.path) {
        window.scrollTo(0, 0)
        prevPage = $page
      }
    }
  }

  // Redirect if we have no user
  $: {
    if (!$pubkey && $page && router.getMatch($page.path).route.requireUser) {
      router.go({path: "/", replace: true})
    }
  }

  // Redirect if we need a signer
  $: {
    if (!$signer && $page && router.getMatch($page.path).route.requireSigner) {
      router.go({path: "/", replace: true})
    }
  }

  // Redirect if we're missing required parameters. This is usually due to a malformed url.
  $: {
    const props = router.getProps($current)

    for (const k of router.getMatch($current.path).route.required || []) {
      if (!props[k]) {
        router.go({path: "/", replace: true})
        break
      }
    }
  }
</script>

{#key $pubkey}
  <div
    id="page"
    class={cx("relative pb-32 text-neutral-100 lg:ml-72 lg:pt-16", {
      "pointer-events-none": $menuIsOpen,
    })}>
    {#if $page}
      {@const promise = router.getMatch($page.path).route.component()}
      {#key router.getKey($page)}
        <div class="m-auto flex w-full max-w-2xl flex-grow flex-col gap-4 p-4">
          {#await promise}
            <!-- pass -->
          {:then component}
            <svelte:component this={component.default || component} {...router.getProps($page)} />
          {/await}
        </div>
      {/key}
    {/if}
  </div>
{/key}

{#each reverse($modals).filter(m => !m.virtual) as m, i (router.getKey(m) + i)}
  {@const promise = router.getMatch(m.path).route.component()}
  <Modal virtual={false} canClose={!m.noEscape}>
    {#key $pubkey}
      {#await promise}
        <!-- pass -->
      {:then component}
        <svelte:component this={component.default || component} {...router.getProps(m)} />
      {/await}
    {/key}
  </Modal>
{/each}
