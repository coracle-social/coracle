<script lang="ts">
  import {fly} from "@lib/transition"

  export let component
  export let props = {}
</script>

<div class="bg-alt modal-box overflow-visible overflow-y-auto" transition:fly={{duration: 100}}>
  <svelte:component this={component} {...props} />
</div>
