<script lang="ts">
  import {last} from "ramda"
  import {derived} from "svelte/store"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {
    canSign,
    relays,
    userRelayPolicies,
    joinRelay,
    leaveRelay,
    broadcastUserData,
  } from "src/engine"
  import {router} from "src/app/util/router"

  export let url

  const relay = relays.key(url)
  const joined = derived(userRelayPolicies, $policies =>
    Boolean($policies.find(p => p.url === url)),
  )

  let actions = []

  $: {
    actions = []

    if (!$joined) {
      actions.push({
        onClick: () => joinRelay(url),
        label: "Join",
        icon: "right-to-bracket",
      })
    } else if ($userRelayPolicies.length > 1) {
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
        onClick: () => window.open("mailto:" + last($relay.contact.split(":"))),
        label: "Contact",
        icon: "envelope",
      })
    }
  }
</script>

<OverflowMenu {actions} />
