<script lang="ts">
  import {page} from "$app/stores"
  import Drawer from "@lib/components/Drawer.svelte"
  import Dialog from "@lib/components/Dialog.svelte"
  import {modals, clearModals} from "@app/modal"

  const onKeyDown = (e: any) => {
    if (e.code === "Escape" && e.target === document.body) {
      clearModals()
    }
  }

  let modal: any

  $: hash = $page.url.hash.slice(1)
  $: hashIsValid = Boolean($modals[hash])
  $: modal = $modals[hash] || modal
</script>

<svelte:window on:keydown={onKeyDown} />

{#if hashIsValid && modal?.options?.drawer}
  <Drawer onClose={clearModals}>
    {#key modal.id}
      <svelte:component this={modal.component} {...modal.props} />
    {/key}
  </Drawer>
{:else if hashIsValid && modal}
  <Dialog onClose={clearModals}>
    {#key modal.id}
      <svelte:component this={modal.component} {...modal.props} />
    {/key}
  </Dialog>
{/if}
