<script lang="ts">
  import "@src/app.css"
  import {page} from "$app/stores"
  import {fly} from "@lib/transition"
  import ModalBox from "@lib/components/ModalBox.svelte"
  import Toast from "@app/components/Toast.svelte"
  import PrimaryNav from "@app/components/PrimaryNav.svelte"
  import SecondaryNav from "@app/components/SecondaryNav.svelte"
  import {modals} from "@app/modal"

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

  let modal: HTMLDialogElement

  $: {
    if ($page.state.modal) {
      modal?.showModal()
    } else {
      modal?.close()
    }
  }
</script>

<div data-theme="dark">
  <div class="flex h-screen">
    <PrimaryNav />
    <SecondaryNav />
    <div class="flex-grow bg-base-200">
      <slot />
    </div>
  </div>
  <dialog bind:this={modal} class="modal modal-bottom sm:modal-middle !z-modal">
    {#if $page.state.modal}
      {#key $page.state.modal}
        <ModalBox {...modals.get($page.state.modal)} />
      {/key}
      <Toast />
    {/if}
    <form method="dialog" class="modal-backdrop">
      <button />
    </form>
  </dialog>
  <Toast />
</div>
