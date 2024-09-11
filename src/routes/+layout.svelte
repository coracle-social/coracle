<script lang="ts">
  import "@src/app.css"
  import {onMount} from "svelte"
  import {get} from "svelte/store"
  import {page} from "$app/stores"
  import {goto} from "$app/navigation"
  import {browser} from "$app/environment"
  import {sleep} from "@welshman/lib"
  import {
    relays,
    handles,
    loadRelay,
    db,
    initStorage,
    repository,
    session,
    pubkey,
    publishStatusData,
    plaintext,
    freshness,
    storageAdapters,
    tracker,
  } from "@welshman/app"
  import * as app from "@welshman/app"
  import {createEventStore} from "@welshman/store"
  import ModalBox from "@lib/components/ModalBox.svelte"
  import Toast from "@app/components/Toast.svelte"
  import Landing from "@app/components/Landing.svelte"
  import PrimaryNav from "@app/components/PrimaryNav.svelte"
  import {modals, clearModal} from "@app/modal"
  import {theme} from "@app/theme"
  import {INDEXER_RELAYS} from "@app/state"
  import {loadUserData} from "@app/commands"
  import * as state from "@app/state"

  let ready: Promise<unknown>
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
    Object.assign(window, {get, ...app, ...state})

    ready = db
      ? Promise.resolve()
      : initStorage("flotilla", 3, {
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
          publishStatus: storageAdapters.fromObjectStore(publishStatusData),
          freshness: storageAdapters.fromObjectStore(freshness),
          plaintext: storageAdapters.fromObjectStore(plaintext),
          tracker: storageAdapters.fromTracker(tracker),
        }).then(() => sleep(300)) // Wait an extra few ms because of repository throttle

    dialog.addEventListener("close", () => {
      if (modal) {
        clearModal()
      }
    })

    ready.then(() => {
      for (const url of INDEXER_RELAYS) {
        loadRelay(url)
      }

      if ($pubkey) {
        loadUserData($pubkey)
      }
    })
  })
</script>

{#await ready}
  <div data-theme={$theme} />
{:then}
  <div data-theme={$theme}>
    <div class="flex h-screen overflow-hidden">
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
