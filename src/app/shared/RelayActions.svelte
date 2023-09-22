<script lang="ts">
  import {last, prop} from "ramda"
  import {modal} from "src/partials/state"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {canSign, relays, relayPolicyUrls, joinRelay, leaveRelay, deriveHasRelay} from "src/engine"
  import {addToList} from "src/app/state"

  export let relay

  const info = relays.key(relay.url).derived(prop("info"))
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
        onClick: () => addToList("r", relay.url),
        label: "Add to list",
        icon: "scroll",
      })

      actions.push({
        onClick: () => modal.push({type: "relay/review", url: relay.url}),
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
