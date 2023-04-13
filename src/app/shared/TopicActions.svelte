<script lang="ts">
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {addToFeed} from "src/app/state"

  export let topic

  let actions = []

  $: {
    actions.push({
      onClick: () => addToFeed("topics", topic),
      label: "Add to feed",
      icon: "scroll",
    })
  }
</script>

<OverflowMenu {actions} />
