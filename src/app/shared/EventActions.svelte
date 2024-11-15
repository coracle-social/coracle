<script lang="ts">
  import {ctx} from "@welshman/lib"
  import {Address} from "@welshman/util"
  import {repository} from "@welshman/app"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {router} from "src/app/util/router"

  export let event

  const address = Address.fromEvent(event, ctx.app.router.Event(event).limit(3).getUrls())

  let actions = []

  $: {
    actions = []

    if (!repository.isDeleted(event)) {
      actions.push({
        onClick: () => router.at("qrcode").of(address.toNaddr()).open(),
        label: "Share",
        icon: "share-nodes",
      })
    }
  }
</script>

<div class="flex items-center gap-3" on:click|stopPropagation>
  <OverflowMenu {actions} />
</div>
