<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {ago, WEEK} from "@welshman/lib"
  import {GROUP_META, EVENT_TIME, GROUPS, THREAD, COMMENT, MESSAGE} from "@welshman/util"
  import {request} from "@welshman/net"
  import Page from "@lib/components/Page.svelte"
  import SecondaryNav from "@lib/components/SecondaryNav.svelte"
  import MenuSpace from "@app/components/MenuSpace.svelte"
  import SpaceAuthError from "@app/components/SpaceAuthError.svelte"
  import {pushToast} from "@app/toast"
  import {pushModal} from "@app/modal"
  import {getUploadUrl} from "@app/editor"
  import {setChecked} from "@app/notifications"
  import {checkRelayConnection, checkRelayAuth, checkRelayAccess} from "@app/commands"
  import {decodeRelay, userRoomsByUrl} from "@app/state"
  import {pullConservatively} from "@app/requests"
  import {notifications} from "@app/notifications"
  interface Props {
    children?: import("svelte").Snippet
  }

  const {children}: Props = $props()

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
  $effect(() => {
    if ($notifications.has($page.url.pathname)) {
      setChecked($page.url.pathname)
    }
  })

  onMount(() => {
    checkConnection()

    // Prime our cache so inputs show up quickly
    getUploadUrl(url)

    const relays = [url]
    const since = ago(WEEK)
    const controller = new AbortController()

    // Load group meta, threads, calendar events, comments, and recent messages
    // for user rooms to help with a quick page transition
    pullConservatively({
      relays,
      filters: [
        {kinds: [GROUP_META]},
        {kinds: [THREAD, EVENT_TIME], since},
        {kinds: [COMMENT], "#K": [String(THREAD), String(EVENT_TIME)], since},
        ...rooms.map(room => ({kinds: [MESSAGE], "#h": [room], since})),
      ],
    })

    // Completely refresh our groups list and listen for new ones
    request({relays, filters: [{kinds: [GROUPS]}], signal: controller.signal})

    return () => {
      controller.abort()
    }
  })
</script>

<SecondaryNav>
  <MenuSpace {url} />
</SecondaryNav>
<Page>
  {#key $page.url.pathname}
    {@render children?.()}
  {/key}
</Page>
