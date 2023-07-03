<script lang="ts">
  import {find, last, propEq} from "ramda"
  import {modal} from "src/partials/state"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {keys, routing} from "src/system"
  import {watch} from "src/agent/db"
  import {addToList} from "src/app/state"

  export let relay

  relay = routing.getRelay(relay.url)

  const {canSign} = keys
  const relays = watch(routing.policies, () => routing.getUserRelays())

  let actions = []

  $: joined = find(propEq("url", relay.url), $relays)
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

    if (relay.meta.contact) {
      actions.push({
        onClick: () => window.open("mailto:" + last(relay.meta.contact.split(":"))),
        label: "Contact",
        icon: "envelope",
      })
    }
  }
</script>

<OverflowMenu {actions} />
