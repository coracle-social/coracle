<script lang="ts">
  import {last} from "ramda"
  import {modal} from "src/partials/state"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {keys, routing} from "src/system"
  import {watch} from "src/util/loki"
  import {addToList} from "src/app/state"

  export let relay

  const {canSign} = keys
  const meta = routing.getRelayMeta(relay.url)
  const relays = watch(routing.policies, () => routing.getUserRelayUrls())

  let actions = []

  $: joined = $relays.includes(relay.url)
  $: {
    actions = []

    if (!joined) {
      actions.push({
        onClick: () => routing.addUserRelay(relay.url),
        label: "Join",
        icon: "right-to-bracket",
      })
    } else if ($relays.length > 1) {
      actions.push({
        onClick: () => routing.removeUserRelay(relay.url),
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

    if (meta.contact) {
      actions.push({
        onClick: () => window.open("mailto:" + last(meta.contact.split(":"))),
        label: "Contact",
        icon: "envelope",
      })
    }
  }
</script>

<OverflowMenu {actions} />
