<script lang="ts">
  import {getProps} from "src/util/router"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import NavSearchIcon from "src/app/NavSearchIcon.svelte"
  import {menuIsOpen, searchIsOpen, hasNewDMs} from "src/app/state"
  import {router} from "src/app/router"
  import {pubkey, hasNewNotifications} from "src/engine"

  const {page} = router

  const logoUrl = import.meta.env.VITE_LOGO_URL || "/images/logo.png"

  const openMenu = () => console.log('here')||menuIsOpen.set(true)

  const openSearch = () => searchIsOpen.set(true)

  const createNote = () => {
    const params = {} as any
    const props = getProps($page) as any

    if ($page.path.startsWith("/people") && props.pubkey) {
      params.pubkey = props.pubkey
    }

    if ($page.path.startsWith("/groups") && props.address) {
      params.group = props.address
    }

    router.at("notes/create").qp(params).open()
  }
</script>

<div class="absolute top-0 w-full p-3 flex justify-between items-center border-b border-solid border-mid">
  <img alt="App Logo" src={logoUrl} class="w-10" />
</div>

<div
  class="fixed bottom-0 left-0 right-0 flex justify-between items-center bg-dark py-2 px-4 border-t border-solid border-mid">
  <NavSearchIcon on:click={openSearch} />
  <Anchor button accent on:click={createNote}>Post +</Anchor>
  <div class="flex items-center cursor-pointer" on:click={openMenu}>
    <i class="fa fa-bars text-warm fa-2xl" />
    {#if $pubkey}
      <div class="-ml-2 border-4 border-solid border-dark rounded-full">
        <PersonCircle class="h-10 w-10" pubkey={$pubkey} />
        {#if $hasNewNotifications || $hasNewDMs}
          <div class="absolute right-4 top-4 h-2 w-2 rounded bg-accent" />
        {/if}
      </div>
    {/if}
  </div>
</div>
