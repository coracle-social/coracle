<script lang="ts">
  import {last} from "ramda"
  import {modal} from "src/partials/state"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {nip65, keys, user} from "src/app/engine"
  import {addToList} from "src/app/state"

  export let relay

  const info = nip65.getRelayInfo(relay.url)
  const relays = nip65.policies.key(keys.pubkey.get()).derived(() => user.getRelayUrls())

  let actions = []

  $: joined = $relays.includes(relay.url)
  $: {
    actions = []

    if (!joined) {
      actions.push({
        onClick: () => user.addRelay(relay.url),
        label: "Join",
        icon: "right-to-bracket",
      })
    } else if ($relays.length > 1) {
      actions.push({
        onClick: () => user.removeRelay(relay.url),
        label: "Leave",
        icon: "right-from-bracket",
      })
    }

    if (keys.canSign.get()) {
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
