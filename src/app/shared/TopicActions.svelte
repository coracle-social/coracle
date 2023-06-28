<script lang="ts">
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {addToList} from "src/app/state"
  import {keys} from "src/system"

  export let topic

  const {canSign} = keys

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
