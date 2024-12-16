<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {now} from "@welshman/lib"
  import {subscribe} from "@welshman/app"
  import {DELETE, REACTION, GROUPS} from "@welshman/util"
  import Page from "@lib/components/Page.svelte"
  import SecondaryNav from "@lib/components/SecondaryNav.svelte"
  import MenuSpace from "@app/components/MenuSpace.svelte"
  import SpaceAuthError from "@app/components/SpaceAuthError.svelte"
  import {pushToast} from "@app/toast"
  import {pushModal} from "@app/modal"
  import {setChecked} from "@app/notifications"
  import {checkRelayConnection, checkRelayAuth, checkRelayAccess} from "@app/commands"
  import {decodeRelay} from "@app/state"
  import {notifications} from "@app/notifications"

  const url = decodeRelay($page.params.relay)

  const checkConnection = async () => {
    const connectionError = await checkRelayConnection(url)

    if (connectionError) {
      return pushToast({theme: "error", message: connectionError})
    }

    const [authError, accessError] = await Promise.all([checkRelayAuth(url), checkRelayAccess(url)])

    const error = authError || accessError

    if (error) {
      pushModal(SpaceAuthError, {url, error})
    }
  }

  // We have to watch this one, since on mobile the badge will be visible when active
  $: {
    if ($notifications.has($page.url.pathname)) {
      setChecked($page.url.pathname)
    }
  }

  onMount(() => {
    checkConnection()

    const sub = subscribe({
      relays: [url],
      filters: [{kinds: [GROUPS]}, {kinds: [DELETE, REACTION], since: now()}],
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
  {#key $page.url.pathname}
    <slot />
  {/key}
</Page>
