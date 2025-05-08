<script lang="ts">
  import cx from "classnames"
  import {signer, pubkey} from "@welshman/app"
  import {isMobile} from "src/util/html"
  import Modal from "src/partials/Modal.svelte"
  import {menuIsOpen} from "src/app/state"
  import {router} from "src/app/util/router"

  const {current, page, modals} = router

  let prevPage

  $: {
    if ($page && $page.path !== prevPage?.path) {
      window.scrollTo(0, 0)
      prevPage = $page
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
    if ($current) {
      const props = router.getProps($current)

      for (const k of router.getMatch($current.path).route.required || []) {
        if (!props[k]) {
          router.go({path: "/", replace: true})
          break
        }
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
      {@const {component} = router.getMatch($page.path).route}
      {#key router.getKey($page)}
        <div class="my-sai m-auto w-full max-w-2xl">
          <div class="flex max-w-2xl flex-grow flex-col gap-4 p-4">
            <svelte:component this={component} {...router.getProps($page)} />
          </div>
        </div>
      {/key}
    {/if}
  </div>
{/key}

{#each [...$modals].reverse().filter(m => !m.virtual) as m, i (router.getKey(m) + i)}
  {@const {component} = router.getMatch(m.path).route}
  <Modal
    mini={m.mini}
    overlay={m.overlay}
    drawer={!isMobile && m.drawer}
    virtual={false}
    canClose={!m.noEscape}>
    <svelte:component this={component} {...router.getProps(m)} />
  </Modal>
{/each}
