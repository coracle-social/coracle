<script lang="ts">
  import {find, last, propEq} from "ramda"
  import {modal} from "src/partials/state"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {keys} from "src/system"
  import user from "src/agent/user"
  import {getRelayWithFallback} from "src/agent/db"
  import {addToList} from "src/app/state"

  export let relay

  relay = getRelayWithFallback(relay.url)

  const {canSign} = keys
  const {relays: userRelays} = user

  let actions = []

  $: joined = find(propEq("url", relay.url), $userRelays)
  $: {
    actions = []

    if (!joined) {
      actions.push({
        onClick: () => user.addRelay(relay.url),
        label: "Join",
        icon: "right-to-bracket",
      })
    } else if ($userRelays.length > 1) {
      actions.push({
        onClick: () => user.removeRelay(relay.url),
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

    if (relay.contact) {
      actions.push({
        onClick: () => window.open("mailto:" + last(relay.contact.split(":"))),
        label: "Contact",
        icon: "envelope",
      })
    }
  }
</script>

<OverflowMenu {actions} />
