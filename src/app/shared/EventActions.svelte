<script lang="ts">
  import {ctx} from "@welshman/lib"
  import {Address} from "@welshman/util"
  import {repository, pubkey} from "@welshman/app"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {router} from "src/app/util/router"

  export let event

  const address = Address.fromEvent(event, ctx.app.router.Event(event).redundancy(3).getUrls())

  let actions = []

  $: {
    actions = []

    if (!repository.isDeleted(event)) {
      actions.push({
        onClick: () => router.at("qrcode").of(address.toNaddr()).open(),
        label: "Share",
        icon: "share-nodes",
      })

      if (event.pubkey === $pubkey) {
        actions.push({
          onClick: () => router.at("events").of(address.toString()).cx({event}).at("edit").open(),
          label: "Edit",
          icon: "edit",
        })

        actions.push({
          onClick: () => router.at("events").of(address.toString()).cx({event}).at("delete").open(),
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
