<script lang="ts">
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {addToList} from "src/app/state"
  import user from "src/agent/user"

  export let topic

  const {canPublish} = user

  let actions = []

  $: {
    actions = []

    if ($canPublish) {
      actions.push({
        onClick: () => addToList("t", topic),
        label: "Add to list",
        icon: "scroll",
      })
    }
  }
</script>

<OverflowMenu {actions} />
