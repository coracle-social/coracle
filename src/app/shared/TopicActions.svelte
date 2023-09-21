<script lang="ts">
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {addToList} from "src/app/state"
  import {canSign} from "src/engine"

  export let topic

  let actions = []

  $: {
    actions = []

    if ($canSign) {
      actions.push({
        onClick: () => addToList("t", topic),
        label: "Add to list",
        icon: "scroll",
      })
    }
  }
</script>

<OverflowMenu {actions} />
