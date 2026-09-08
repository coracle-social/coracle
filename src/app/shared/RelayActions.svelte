<script lang="ts">
  import {derived} from "svelte/store"
  import {MessagingRelayLists, RelayLists, Relays} from "@welshman/app"
  import {fromApp, signer} from "src/engine/core"
  import {ensureMailto} from "src/util/misc"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {joinRelay, leaveRelay} from "src/engine"
  import {router} from "src/app/util/router"

  export let url

  const relay = fromApp($app => $app.use(Relays).one(url))

  const userRelayUrls = fromApp($app =>
    derived(
      [
        $app.use(RelayLists).urls($app.user?.pubkey ?? "").$,
        $app.use(MessagingRelayLists).urls($app.user?.pubkey ?? "").$,
      ],
      ([$relayUrls, $messagingUrls]) => [...$relayUrls, ...$messagingUrls],
    ),
  )

  let actions = []

  $: {
    actions = []

    if (!$userRelayUrls.includes(url)) {
      actions.push({
        onClick: () => joinRelay(url),
        label: "Join",
        icon: "right-to-bracket",
      })
    } else if ($userRelayUrls.length > 1) {
      actions.push({
        onClick: () => leaveRelay(url),
        label: "Leave",
        icon: "right-from-bracket",
      })
    }

    if ($signer) {
      actions.push({
        onClick: () => router.at("lists/select").qp({type: "r", value: url}).open(),
        label: "Add to list",
        icon: "list",
      })
    }

    if ($relay?.contact) {
      actions.push({
        onClick: () => window.open(ensureMailto($relay.contact)),
        label: "Contact",
        icon: "envelope",
      })
    }
  }
</script>

<OverflowMenu {actions} />
