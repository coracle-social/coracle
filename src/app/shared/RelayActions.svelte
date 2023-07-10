<script lang="ts">
  import {last} from "ramda"
  import {modal} from "src/partials/state"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {routing, user} from "src/app/system"
  import {watch} from "src/util/loki"
  import {addToList} from "src/app/state"

  export let relay

  const info = routing.getRelayInfo(relay.url)
  const relays = watch(routing.policies, () => user.getRelayUrls())

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

    if (user.canSign()) {
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
