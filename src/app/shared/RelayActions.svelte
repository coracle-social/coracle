<script lang="ts">
  import {last} from "ramda"
  import {modal} from "src/partials/state"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {relayUrls, addRelay, removeRelay, hasRelay} from "src/engine2"
  import {Nip65, Keys} from "src/app/engine"
  import {addToList} from "src/app/state"

  export let relay

  const info = Nip65.getRelayInfo(relay.url)
  const joined = hasRelay(relay.url)

  let actions = []

  $: {
    actions = []

    if (!$joined) {
      actions.push({
        onClick: () => addRelay(relay.url),
        label: "Join",
        icon: "right-to-bracket",
      })
    } else if ($relayUrls.length > 1) {
      actions.push({
        onClick: () => removeRelay(relay.url),
        label: "Leave",
        icon: "right-from-bracket",
      })
    }

    if (Keys.canSign.get()) {
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

    if (info.contact) {
      actions.push({
        onClick: () => window.open("mailto:" + last(info.contact.split(":"))),
        label: "Contact",
        icon: "envelope",
      })
    }
  }
</script>

<OverflowMenu {actions} />
