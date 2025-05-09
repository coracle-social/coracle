<script lang="ts">
  import {FeedType} from "@welshman/feeds"
  import {maxWot} from "@welshman/app"
  import RangeInput from "src/partials/RangeInput.svelte"

  export let feed
  export let onChange

  const changeValue = ({min, max}) => onChange([FeedType.WOT, {min, max}])

  $: min = feed[1]?.min || 0
  $: max = feed[1]?.max || 1
</script>

<div class="flex justify-between">
  <span class="staatliches text-lg">What web of trust score would you like to target?</span>
  <span class="text-xs">{Math.round(min * $maxWot)}-{Math.round(max * $maxWot)}</span>
</div>
<RangeInput step={0.01} value={{min, max}} min={0} max={1} onChange={changeValue}></RangeInput>
