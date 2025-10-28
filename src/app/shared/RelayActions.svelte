<script lang="ts">
  import {getRelaysFromList} from "@welshman/util"
  import {
    pubkey,
    signer,
    deriveRelaySelections,
    deriveInboxRelaySelections,
    deriveRelay,
  } from "@welshman/app"
  import {ensureMailto} from "src/util/misc"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {joinRelay, leaveRelay} from "src/engine"
  import {router} from "src/app/util/router"

  export let url

  const relay = deriveRelay(url)

  const userRelaySelections = deriveRelaySelections($pubkey)

  const userInboxRelaySelections = deriveInboxRelaySelections($pubkey)

  let actions = []

  $: {
    actions = []

    const userRelayUrls = [
      ...getRelaysFromList($userRelaySelections),
      ...getRelaysFromList($userInboxRelaySelections),
    ]

    if (!userRelayUrls.includes(url)) {
      actions.push({
        onClick: () => joinRelay(url),
        label: "Join",
        icon: "right-to-bracket",
      })
    } else if (userRelayUrls.length > 1) {
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

      actions.push({
        onClick: () => router.at("relays").of(url).at("review").open(),
        label: "Review",
        icon: "feather",
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
