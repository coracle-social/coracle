<script lang="ts">
  import {last} from "ramda"
  import {normalizeRelayUrl} from 'paravel'
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {canSign, relays, relayPolicyUrls, joinRelay, leaveRelay, deriveHasRelay} from "src/engine"
  import {router} from "src/app/router"

  export let relay

  const url = normalizeRelayUrl(relay.url)
  const info = relays.key(url).derived(r => r?.info)
  const joined = deriveHasRelay(url)

  let actions = []

  $: {
    actions = []

    if (!$joined) {
      actions.push({
        onClick: () => joinRelay(url),
        label: "Join",
        icon: "right-to-bracket",
      })
    } else if ($relayPolicyUrls.length > 1) {
      actions.push({
        onClick: () => leaveRelay(url),
        label: "Leave",
        icon: "right-from-bracket",
      })
    }

    if ($canSign) {
      actions.push({
        onClick: () => router.at("lists/select").qp({type: "r", value: url}).open(),
        label: "Add to list",
        icon: "scroll",
      })

      actions.push({
        onClick: () => router.at("relays").of(url).at("review").open(),
        label: "Review",
        icon: "feather",
      })
    }

    if ($info?.contact) {
      actions.push({
        onClick: () => window.open("mailto:" + last($info.contact.split(":"))),
        label: "Contact",
        icon: "envelope",
      })
    }
  }
</script>

<OverflowMenu {actions} />
