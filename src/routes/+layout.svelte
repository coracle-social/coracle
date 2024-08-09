<script lang="ts">
  import "@src/app.css"
  import {onMount} from 'svelte'
  import {page} from "$app/stores"
  import {fly} from "@lib/transition"
  import ModalBox from "@lib/components/ModalBox.svelte"
  import Toast from "@app/components/Toast.svelte"
  import PrimaryNav from "@app/components/PrimaryNav.svelte"
  import SecondaryNav from "@app/components/SecondaryNav.svelte"
  import {modals, clearModal} from "@app/modal"

  const login = async () => {
    const nl = await import("nostr-login")

    nl.init({
      noBanner: true,
      title: "Welcome to Flotilla!",
      description: "Log in with your Nostr account or sign up to join.",
      methods: ["connect", "extension", "local"],
      onAuth(npub: string) {
        console.log(npub)
      },
    })

    nl.launch()
  }

  let dialog: HTMLDialogElement

  $: modal = $page.url.hash.slice(1)

  $: {
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
        <ModalBox {...modals.get(modal)} />
      {/key}
      <Toast />
    {/if}
    <form method="dialog" class="modal-backdrop">
      <button />
    </form>
  </dialog>
  <Toast />
</div>
