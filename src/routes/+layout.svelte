<script lang="ts">
  import "@src/app.css"
  import {onMount} from 'svelte'
  import {page} from "$app/stores"
  import {fly} from "@lib/transition"
  import ModalBox from "@lib/components/ModalBox.svelte"
  import Toast from "@app/components/Toast.svelte"
  import Landing from "@app/components/Landing.svelte"
  import PrimaryNav from "@app/components/PrimaryNav.svelte"
  import SecondaryNav from "@app/components/SecondaryNav.svelte"
  import {modals, clearModal} from "@app/modal"
  import {session} from "@app/base"

  let dialog: HTMLDialogElement

  $: modalId = $page.url.hash.slice(1)
  $: modal = modals.get(modalId)

  $: {
    if (!modal && !$session) {
      modal = {component: Landing}
    }

    if (modal) {
      dialog?.showModal()
    } else {
      dialog?.close()
    }
  }

  onMount(() => {
    dialog.addEventListener('close', () => {
      if (modal) {
        clearModal()
      }
    })
  })
</script>

<div data-theme="dark">
  <div class="flex h-screen">
    <PrimaryNav />
    <SecondaryNav />
    <div class="flex-grow bg-base-200">
      <slot />
    </div>
  </div>
  <dialog bind:this={dialog} class="modal modal-bottom sm:modal-middle !z-modal">
    {#if modal}
      {#key modal}
        <ModalBox {...modal} />
      {/key}
      <Toast />
    {/if}
    {#if $session}
      <form method="dialog" class="modal-backdrop">
        <button />
      </form>
    {/if}
  </dialog>
  <Toast />
</div>
