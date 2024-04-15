<script lang="ts">
  import {encodeAddress, addressToNaddr} from "@coracle.social/util"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {router} from "src/app/util/router"
  import {pubkey, isDeleted, hints} from "src/engine"

  export let event

  const address = hints.address(event)

  let actions = []

  $: {
    actions = []

    if (!$isDeleted(event)) {
      actions.push({
        onClick: () => router.at("qrcode").of(addressToNaddr(address)).open(),
        label: "Share",
        icon: "share-nodes",
      })

      if (event.pubkey === $pubkey) {
        actions.push({
          onClick: () =>
            router.at("events").of(encodeAddress(address)).cx({event}).at("edit").open(),
          label: "Edit",
          icon: "edit",
        })

        actions.push({
          onClick: () =>
            router.at("events").of(encodeAddress(address)).cx({event}).at("delete").open(),
          label: "Delete",
          icon: "trash",
        })
      }
    }
  }
</script>

<div class="flex items-center gap-3" on:click|stopPropagation>
  <OverflowMenu {actions} />
</div>
