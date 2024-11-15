<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {ifLet, now} from "@welshman/lib"
  import {subscribe} from "@welshman/app"
  import {DELETE, REACTION} from "@welshman/util"
  import Page from "@lib/components/Page.svelte"
  import SecondaryNav from "@lib/components/SecondaryNav.svelte"
  import MenuSpace from "@app/components/MenuSpace.svelte"
  import {pushToast} from "@app/toast"
  import {setChecked} from "@app/notifications"
  import {checkRelayConnection, checkRelayAuth} from "@app/commands"
  import {decodeRelay, MEMBERSHIPS} from "@app/state"
  import {deriveNotification, SPACE_FILTERS} from "@app/notifications"

  const url = decodeRelay($page.params.relay)

  const notification = deriveNotification($page.url.pathname, SPACE_FILTERS, url)

  const checkConnection = async () => {
    ifLet(await checkRelayConnection(url), error => {
      pushToast({theme: "error", message: error})
    })

    ifLet(await checkRelayAuth(url, 30_000), error => {
      pushToast({theme: "error", message: error})
    })
  }

  // We have to watch this one, since on mobile the badge wil be visible when active
  $: {
    if ($notification) {
      setChecked($page.url.pathname)
    }
  }

  onMount(() => {
    checkConnection()

    const sub = subscribe({
      relays: [url],
      filters: [{kinds: [MEMBERSHIPS]}, {kinds: [DELETE, REACTION], since: now()}],
    })

    return () => {
      sub.close()
    }
  })
</script>

<SecondaryNav>
  <MenuSpace {url} />
</SecondaryNav>
<Page>
  <slot />
</Page>
