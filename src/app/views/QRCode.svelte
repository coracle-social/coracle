<script lang="ts">
  import Content from "src/partials/Content.svelte"
  import QRCode from "src/partials/QRCode.svelte"

  export let value
</script>

<Content size="lg">
  <QRCode code={value} />
</Content>
