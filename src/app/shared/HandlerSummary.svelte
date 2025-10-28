<script lang="ts">
  import {uniq, pluck} from "@welshman/lib"
  import {getAddress} from "@welshman/util"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import PeopleAction from "src/app/shared/PeopleAction.svelte"
  import {deriveRecommendations} from "src/engine"
  import {pluralize} from "src/util/misc"

  export let handler

  const address = getAddress(handler.event)
  const recommendations = deriveRecommendations(address)
  const pubkeys = uniq(pluck("pubkey", $recommendations))
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
    {#if $recommendations.length > 0}
      <div class="text-tinted-200">
        <PeopleAction {pubkeys} {actionText} />
      </div>
    {/if}
  </FlexColumn>
</div>
