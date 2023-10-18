<script lang="ts">
  import {last} from "ramda"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {canSign, relays, relayPolicyUrls, joinRelay, leaveRelay, deriveHasRelay} from "src/engine"
  import {router} from "src/app/router"

  export let relay

  const info = relays.key(relay.url).derived(r => r.info)
  const joined = deriveHasRelay(relay.url)

  let actions = []

  $: {
    actions = []

    if (!$joined) {
      actions.push({
        onClick: () => joinRelay(relay.url),
        label: "Join",
        icon: "right-to-bracket",
      })
    } else if ($relayPolicyUrls.length > 1) {
      actions.push({
        onClick: () => leaveRelay(relay.url),
        label: "Leave",
        icon: "right-from-bracket",
      })
    }

    if ($canSign) {
      actions.push({
        onClick: () => router.at("lists/select").qp({type: "r", value: relay.url}).open(),
        label: "Add to list",
        icon: "scroll",
      })

      actions.push({
        onClick: () => router.at("relays").of(relay.url).at("review").open(),
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
