<script lang="ts">
  import {find, last, propEq} from "ramda"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import user from "src/agent/user"
  import {getRelayWithFallback} from "src/agent/tables"

  export let relay

  relay = getRelayWithFallback(relay.url)

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

    if (relay.contact) {
      actions.push({
        onClick: () => window.open("mailto:" + last(relay.contact.split(":"))),
        label: "Contact",
        icon: "envelope",
      })
    }
  }
</script>

{#if actions.length > 0}
  {#if actions.length === 1}
    <Popover triggerType="mouseenter">
      <Anchor slot="trigger" type="button-circle" on:click={actions[0].onClick}>
        <i class={`fa fa-${actions[0].icon}`} />
      </Anchor>
      <p slot="tooltip">{actions[0].label}</p>
    </Popover>
  {:else}
    <OverflowMenu {actions} />
  {/if}
{/if}
