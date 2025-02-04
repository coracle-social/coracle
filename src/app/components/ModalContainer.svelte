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

  let modal: any = $state()
  const hash = $derived($page.url.hash.slice(1))
  const hashIsValid = $derived(Boolean($modals[hash]))

  $effect(() => {
    if ($modals[hash]) {
      modal = $modals[hash]
    }
  })
</script>

<svelte:window onkeydown={onKeyDown} />

{#if hashIsValid && modal?.options?.drawer}
  <Drawer onClose={clearModals} {...modal.options}>
    {#key modal.id}
      <modal.component {...modal.props} />
    {/key}
  </Drawer>
{:else if hashIsValid && modal}
  <Dialog onClose={clearModals} {...modal.options}>
    {#key modal.id}
      <modal.component {...modal.props} />
    {/key}
  </Dialog>
{/if}
