<script lang="ts">
  import {uniq, prop} from "@welshman/lib"
  import {pluralize} from "hurdak"
  import {getAddress} from "@welshman/util"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import PeopleAction from "src/app/shared/PeopleAction.svelte"
  import {recommendationsByHandlerAddress} from "src/engine"

  export let handler

  const address = getAddress(handler.event)
  const recommendations = $recommendationsByHandlerAddress.get(address) || []
  const pubkeys = uniq(recommendations.map(prop("pubkey")))
  const actionText = `${pluralize(pubkeys.length, "recommends", "recommend")} this app`
</script>

<div class="flex gap-3">
  <ImageCircle class="h-14 w-14" src={handler.image} />
  <FlexColumn xs>
    <p class="text-lg">{handler.name}</p>
    {#if handler.about}
      <p class="text-tinted-200">{handler.about}</p>
    {/if}
    <slot />
    {#if recommendations.length > 0}
      <div class="text-tinted-200">
        <PeopleAction {pubkeys} {actionText} />
      </div>
    {/if}
  </FlexColumn>
</div>
