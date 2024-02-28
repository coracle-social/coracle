<script lang="ts">
  import {Address} from "paravel"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {router} from "src/app/router"
  import {pubkey, isDeleted} from "src/engine"

  export let event

  const addr = Address.fromEvent(event)

  let actions = []

  $: {
    actions = []

    if (!$isDeleted(event)) {
      actions.push({
        onClick: () => router.at("qrcode").of(addr.asNaddr()).open(),
        label: "Share",
        icon: "share-nodes",
      })

      if (event.pubkey === $pubkey) {
        actions.push({
          onClick: () => router.at("events").of(addr.asRaw()).cx({event}).at("edit").open(),
          label: "Edit",
          icon: "edit",
        })

        actions.push({
          onClick: () => router.at("events").of(addr.asRaw()).cx({event}).at("delete").open(),
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
