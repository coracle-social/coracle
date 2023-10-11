<script lang="ts">
  import {stringToHue, hsl} from "src/util/misc"

  export let value
</script>

<div
  on:click
  class="h-3 w-3 rounded-full border border-solid border-gray-6"
  style={`background: ${hsl(stringToHue(value))}`} />
