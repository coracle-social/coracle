<script lang="ts">
  import "@src/app.css"
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {goto} from "$app/navigation"
  import {browser} from "$app/environment"
  import {createEventStore} from "@welshman/store"
  import ModalBox from "@lib/components/ModalBox.svelte"
  import Toast from "@app/components/Toast.svelte"
  import Landing from "@app/components/Landing.svelte"
  import PrimaryNav from "@app/components/PrimaryNav.svelte"
  import {modals, clearModal} from "@app/modal"
  import {theme} from "@app/theme"
  import {pk, session, repository, DEFAULT_RELAYS} from "@app/base"
  import {relays, handles, loadRelay} from "@app/state"
  import {initStorage} from "@app/storage"
  import {loadUserData} from "@app/commands"

  let ready: Promise<void>
  let dialog: HTMLDialogElement
  let prev: any

  $: modalId = $page.url.hash.slice(1)
  $: modal = modals.get(modalId)

  $: {
    if (!modal && !$session) {
      modal = {component: Landing}

      if (browser && $page.route?.id !== "/home") {
        goto("/home")
      }
    }
  }

  $: {
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
        keyPath: "id",
        store: createEventStore(repository),
      },
      relays: {
        keyPath: "url",
        store: relays,
      },
      handles: {
        keyPath: "nip05",
        store: handles,
      },
    })

    dialog.addEventListener("close", () => {
      if (modal) {
        clearModal()
      }
    })

    ready.then(() => {
      for (const url of DEFAULT_RELAYS) {
        loadRelay(url)
      }

      if ($pk) {
        loadUserData($pk)
      }
    })
  })
</script>

{#await ready}
  <div data-theme={$theme} />
{:then}
  <div data-theme={$theme}>
    <div class="flex h-screen">
      <PrimaryNav />
      <slot />
    </div>
    <dialog bind:this={dialog} class="modal modal-bottom !z-modal sm:modal-middle">
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
