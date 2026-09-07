<script lang="ts">
  import {derived} from "svelte/store"
  import {max as maxValue} from "@welshman/lib"
  import {FeedType} from "@welshman/feeds"
  import {Wot, WotScope} from "@welshman/app"
  import {fromApp} from "src/engine/core"
  import RangeInput from "src/partials/RangeInput.svelte"

  export let feed
  export let onChange

  // Scored against the user's own follows, which is what the old wot graph counted
  const maxWot = fromApp($app =>
    derived($app.use(Wot).scores(WotScope.Follows).$, $scores =>
      maxValue(Array.from($scores.values())),
    ),
  )

  const changeValue = ({min, max}) => onChange([FeedType.WOT, {min, max}])

  $: min = feed[1]?.min || 0
  $: max = feed[1]?.max || 1
</script>

<div class="flex justify-between">
  <span class="staatliches text-lg">What web of trust score would you like to target?</span>
  <span class="text-xs">{Math.round(min * $maxWot)}-{Math.round(max * $maxWot)}</span>
</div>
<RangeInput step={0.01} value={{min, max}} min={0} max={1} onChange={changeValue}></RangeInput>
