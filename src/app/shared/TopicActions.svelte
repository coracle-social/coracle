<script lang="ts">
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {addToList} from "src/app/state"
  import {keys} from "src/app/engine"

  export let topic

  let actions = []

  $: {
    actions = []

    if (keys.canSign.get()) {
      actions.push({
        onClick: () => addToList("t", topic),
        label: "Add to list",
        icon: "scroll",
      })
    }
  }
</script>

<OverflowMenu {actions} />
