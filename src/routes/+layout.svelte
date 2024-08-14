<script lang="ts">
  import "@src/app.css"
  import {onMount} from 'svelte'
  import {page} from "$app/stores"
  import {createEventStore} from '@welshman/store'
  import {fly} from "@lib/transition"
  import ModalBox from "@lib/components/ModalBox.svelte"
  import Toast from "@app/components/Toast.svelte"
  import Landing from "@app/components/Landing.svelte"
  import PrimaryNav from "@app/components/PrimaryNav.svelte"
  import SecondaryNav from "@app/components/SecondaryNav.svelte"
  import {modals, clearModal} from "@app/modal"
  import {session, sessions, pk, repository} from "@app/base"
  import {plaintext, relays, handles} from "@app/state"
  import {initStorage} from "@app/storage"

  let ready: Promise<void>
  let dialog: HTMLDialogElement
  let prev: any

  $: modalId = $page.url.hash.slice(1)
  $: modal = modals.get(modalId)

  $: {
    if (!modal && !$session) {
      modal = {component: Landing}
    }

    if (modal) {
      dialog?.showModal()
      prev = modal
    } else {
      dialog?.close()
    }
  }

  onMount(() => {
    ready = initStorage({
      events: {
        keyPath: 'id',
        store: createEventStore(repository),
      },
      relays: {
        keyPath: 'url',
        store: relays,
      },
      handles: {
        keyPath: 'nip05',
        store: handles,
      },
    })

    dialog.addEventListener('close', () => {
      if (modal) {
        clearModal()
      }
    })
  })
</script>

{#await ready}
  <div data-theme="dark" />
{:then}
  <div data-theme="dark">
    <div class="flex h-screen">
      <PrimaryNav />
      <SecondaryNav />
      <div class="flex-grow bg-base-200">
        <slot />
      </div>
    </div>
    <dialog bind:this={dialog} class="modal modal-bottom sm:modal-middle !z-modal">
      {#if prev}
        {#key prev}
          <ModalBox {...prev} />
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
{/await}
