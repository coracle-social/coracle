<script lang="ts">
  import {onMount, onDestroy} from "svelte"
  import {page} from "$app/stores"
  import Page from "@lib/components/Page.svelte"
  import Delay from "@lib/components/Delay.svelte"
  import SecondaryNav from "@lib/components/SecondaryNav.svelte"
  import MenuSpace from "@app/components/MenuSpace.svelte"
  import {pushToast} from "@app/toast"
  import {setChecked} from "@app/notifications"
  import {checkRelayConnection, checkRelayAuth} from "@app/commands"
  import {decodeRelay} from "@app/state"

  $: url = decodeRelay($page.params.relay)

  const ifLet = <T,>(x: T | undefined, f: (x: T) => void) => (x === undefined ? undefined : f(x))

  const checkConnection = async () => {
    ifLet(await checkRelayConnection(url), error => {
      pushToast({theme: "error", message: error})
    })

    ifLet(await checkRelayAuth(url), error => {
      pushToast({theme: "error", message: error})
    })
  }

  onMount(() => {
    checkConnection()
  })

  onDestroy(() => {
    setChecked($page.url.pathname)
  })
</script>

{#key url}
  <Delay>
    <SecondaryNav>
      <MenuSpace {url} />
    </SecondaryNav>
    <Page>
      {#key $page.params.room}
        <slot />
      {/key}
    </Page>
  </Delay>
{/key}
