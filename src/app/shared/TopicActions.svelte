<script lang="ts">
  import {signer} from "@welshman/app"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {router} from "src/app/util/router"

  export let topic

  let actions = []

  $: {
    actions = []

    if ($signer) {
      actions.push({
        onClick: () => router.at("lists/select").qp({type: "t", value: topic}).open(),
        label: "Add to list",
        icon: "list",
      })
    }
  }
</script>

<OverflowMenu {actions} />
