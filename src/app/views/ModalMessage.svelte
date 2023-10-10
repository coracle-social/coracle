<script lang="ts">
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"

  export let message
</script>

<Content size="lg">
  <Spinner>{message}</Spinner>
</Content>
