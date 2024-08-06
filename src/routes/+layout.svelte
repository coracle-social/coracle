<script lang="ts">
  import "@src/app.css"
  import {page} from "$app/stores"
  import {fly} from "@lib/transition"
  import {toast} from "@app/toast"
  import {modals} from "@app/modal"
  import PrimaryNav from "@app/components/PrimaryNav.svelte"
  import SecondaryNav from "@app/components/SecondaryNav.svelte"

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

<div class="flex h-screen" data-theme="dark">
  <PrimaryNav />
  <SecondaryNav />
  <div class="flex-grow bg-base-200">
    <slot />
  </div>
</div>

<dialog bind:this={modal} class="modal modal-bottom sm:modal-middle">
  <div class="modal-box">
    {#if $page.state.modal}
      {@const {component, props} = modals.get($page.state.modal)}
      <svelte:component this={component} {...props} />
    {/if}
  </div>
  <form method="dialog" class="modal-backdrop">
    <button />
  </form>
</dialog>

{#if $toast}
  {#key $toast.id}
    <div transition:fly class="toast">
      <div class="alert">
        <span>{$toast.message}</span>
      </div>
    </div>
  {/key}
{/if}
