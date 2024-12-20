<script lang="ts">
  import {currencyOptions} from "src/util/i18n"

  export let code
</script>

{#if code.match(/^sats?$/i)}
  <span style="font-family: Satoshis; font-size: 1.2em;">!</span>
{:else}
  {currencyOptions.find(c => c.code)?.symbol || code}
{/if}
