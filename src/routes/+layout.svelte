<script lang="ts">
  import "@src/app.css"
  import {onMount} from "svelte"
  import {get, derived} from 'svelte/store'
  import {page} from "$app/stores"
  import {goto} from "$app/navigation"
  import {browser} from "$app/environment"
  import {createEventStore, adapter} from "@welshman/store"
  import ModalBox from "@lib/components/ModalBox.svelte"
  import Toast from "@app/components/Toast.svelte"
  import Landing from "@app/components/Landing.svelte"
  import PrimaryNav from "@app/components/PrimaryNav.svelte"
  import {modals, clearModal} from "@app/modal"
  import {theme} from "@app/theme"
  import {pk, session, repository, DEFAULT_RELAYS} from "@app/base"
  import type {PublishStatusData, PublishStatusDataByUrlById} from "@app/state"
  import {relays, freshness, plaintext, handles, loadRelay, publishStatusData} from "@app/state"
  import {initStorage} from "@app/storage"
  import {loadUserData} from "@app/commands"
  import * as base from "@app/base"
  import * as state from "@app/state"

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
    Object.assign(window, {get, base, state})

    ready = initStorage(3, {
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
      publishStatus: {
        keyPath: "id",
        store: adapter({
          store: publishStatusData,
          forward: ($psd: PublishStatusDataByUrlById) => {
            const data = []

            for (const [id, itemsByUrl] of Object.entries($psd)) {
              for (const [url, item] of Object.entries(itemsByUrl)) {
                data.push(item)
              }
            }

            return data
          },
          backward: (data: PublishStatusData[]) => {
            const result: PublishStatusDataByUrlById = {}

            for (const item of data) {
              result[item.id] = result[item.id] || {}
              result[item.id][item.url] = item
            }

            return result
          },
        }),
      },
      freshness: {
        keyPath: "key",
        store: adapter({
          store: freshness,
          forward: ($freshness: Record<string, number>) => Object.entries($freshness).map(([key, ts]) => ({key, ts})),
          backward: (data: any[]) => {
            const result: Record<string, number> = {}

            for (const {key, ts} of data) {
              result[key] = ts
            }

            return result
          },
        }),
      },
      plaintext: {
        keyPath: "id",
        store: adapter({
          store: plaintext,
          forward: ($plaintext: Record<string, string>) => Object.entries($plaintext).map(([id, plaintext]) => ({id, plaintext})),
          backward: (data: any[]) => {
            const result: Record<string, string> = {}

            for (const {id, plaintext} of data) {
              result[id] = plaintext
            }

            return result
          },
        }),
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
