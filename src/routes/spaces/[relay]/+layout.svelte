<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {ago, WEEK} from "@welshman/lib"
  import {GROUPS, MESSAGE, DELETE} from "@welshman/util"
  import {subscribe} from "@welshman/app"
  import Page from "@lib/components/Page.svelte"
  import SecondaryNav from "@lib/components/SecondaryNav.svelte"
  import MenuSpace from "@app/components/MenuSpace.svelte"
  import SpaceAuthError from "@app/components/SpaceAuthError.svelte"
  import {pushToast} from "@app/toast"
  import {pushModal} from "@app/modal"
  import {setChecked} from "@app/notifications"
  import {checkRelayConnection, checkRelayAuth, checkRelayAccess} from "@app/commands"
  import {decodeRelay, userRoomsByUrl, THREAD_FILTER, COMMENT_FILTER} from "@app/state"
  import {pullConservatively} from "@app/requests"
  import {notifications} from "@app/notifications"

  const url = decodeRelay($page.params.relay)

  const rooms = Array.from($userRoomsByUrl.get(url) || [])

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

    const relays = [url]
    const since = ago(WEEK)

    // Load all groups for this space to populate navigation
    pullConservatively({relays, filters: [{kinds: [GROUPS]}]})

    // Load threads and comments
    pullConservatively({
      relays,
      filters: [
        {...THREAD_FILTER, since},
        {...COMMENT_FILTER, since},
      ],
    })

    // Load recent messages for user rooms to help with a quick page transition
    pullConservatively({relays, filters: rooms.map(r => ({kinds: [MESSAGE], "#h": [r], since}))})

    // Listen for deletes that would apply to messages we already have
    const sub = subscribe({relays, filters: [{kinds: [DELETE], since}]})

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
