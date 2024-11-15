<script lang="ts">
  import {page} from "$app/stores"
  import {derived} from "svelte/store"
  import {max} from "@welshman/lib"
  import {matchFilter} from "@welshman/util"
  import {pubkey} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import MenuSpace from "@app/components/MenuSpace.svelte"
  import {checked, getNotification, deriveNotification, THREAD_FILTERS} from "@app/notifications"
  import {
    userMembership,
    getMembershipRoomsByUrl,
    deriveEventsForUrl,
    MESSAGE,
    GENERAL,
  } from "@app/state"
  import {makeRoomPath, makeSpacePath} from "@app/routes"
  import {pushDrawer} from "@app/modal"

  export let url

  const openMenu = () => pushDrawer(MenuSpace, {url})

  const events = deriveEventsForUrl(url, [{kinds: [MESSAGE]}])

  const threadsPath = makeSpacePath(url, "threads")

  const threadsNotification = deriveNotification(threadsPath, THREAD_FILTERS, url)

  const notification = derived(
    [page, events, checked, userMembership],
    ([$page, $events, $checked, $userMembership]) =>
      getMembershipRoomsByUrl(url, $userMembership)
        .concat(GENERAL)
        .some(room => {
          const path = makeRoomPath(url, room)

          if ($page.url.pathname === path) return false

          const lastChecked = max([$checked["*"], $checked[path]])
          const roomEvents = $events.filter(e => matchFilter({"#~": [room]}, e))

          return getNotification($pubkey, lastChecked, roomEvents)
        }),
  )
</script>

<Button on:click={openMenu} class="btn btn-neutral btn-sm relative md:hidden">
  <Icon icon="menu-dots" />
  {#if $threadsNotification || $notification}
    <div class="absolute right-0 top-0 -mr-1 -mt-1 h-2 w-2 rounded-full bg-primary" />
  {/if}
</Button>
