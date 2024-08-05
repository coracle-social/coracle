<script lang="ts">
  import "src/app.css"
  import {onMount} from 'svelte'
  import {page} from '$app/stores'
  import {onNavigate} from '$app/navigation'
  import Icon from 'lib/components/Icon.svelte'
  import PrimaryNav from 'app/components/PrimaryNav.svelte'
  import SecondaryNav from 'app/components/SecondaryNav.svelte'
  import {fly, toast, modals, pushModal} from 'app/state'

  const login = async () => {
    const nl = await import('nostr-login')

    nl.init({
      noBanner: true,
      title: 'Welcome to Flotilla!',
      description: 'Log in with your Nostr account or sign up to join.',
      methods: "connect,extension,local",
      onAuth(npub: string) {
        console.log(npub)
      }
    })

    nl.launch()
  }

  let modal

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
  <div class="bg-base-200 flex-grow">
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
  <div transition:fly class="toast">
    <div class="alert">
      <span>{$toast.message}</span>
    </div>
  </div>
{/if}
