<script lang="ts">
  import {onMount} from 'svelte'
  import type {SvelteComponent} from "svelte"
  import {page} from "$app/stores"
  import {fly} from "@lib/transition"
  import Drawer from "@lib/components/Drawer.svelte"
  import {modals} from "@app/modal"
  import Toast from "@app/components/Toast.svelte"

  let prev: any
  let mounted = false
  let dialog: HTMLDialogElement
  let drawer: SvelteComponent

  $: hash = $page.url.hash.slice(1)
  $: modal = modals.get(hash)
  $: prev = modal || prev

  $: {
    if (mounted) {
      if (modal?.options?.drawer) {
        drawer.open()
      } else if (modal) {
        dialog.showModal()
      } else {
        drawer.close()
        dialog.close()
      }
    }
  }

  onMount(() => {
    mounted = true
  })
</script>

<dialog bind:this={dialog} class="modal modal-bottom !z-modal sm:modal-middle">
  {#if modal && !modal.options?.drawer}
    {#key hash}
      <div class="bg-alt modal-box overflow-visible overflow-y-auto" transition:fly={{duration: 100}}>
        <svelte:component this={modal.component} {...modal.props} />
      </div>
    {/key}
    <Toast />
  {/if}
  <form method="dialog" class="modal-backdrop">
    <button />
  </form>
</dialog>
<Drawer bind:this={drawer}>
  {#if modal && modal.options?.drawer}
    {#key hash}
      <svelte:component this={modal.component} {...modal.props} />
    {/key}
  {/if}
</Drawer>
