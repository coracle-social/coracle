<script lang="ts">
  import {fly} from "@lib/transition"

  export let component
  export let props = {}
</script>

<div class="modal-box bg-alt overflow-visible" transition:fly={{duration: 100}}>
  <svelte:component this={component} {...props} />
</div>
