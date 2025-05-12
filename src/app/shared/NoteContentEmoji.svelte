<script lang="ts">
  import {imgproxy} from "src/engine"

  export let url: string = undefined
  export let name: string

</script>

{#if url}
  <img src={imgproxy(url, {w: 24, h: 24})} class="h-[1em] min-w-[1em] -mt-0.5 align-middle inline"/>
{:else}
  :{name}:
{/if}
