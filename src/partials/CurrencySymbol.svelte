<script lang="ts">
  import {whereEq} from "ramda"
  import {currencyOptions} from "src/util/i18n"

  export let code
</script>

{#if code.match(/^sats?$/i)}
  <span style="font-family: Satoshis; font-size: 1.2em;">!</span>
{:else}
  {currencyOptions.find(whereEq({code}))?.symbol || code}
{/if}
