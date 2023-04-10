<script lang="ts">
  import {copyToClipboard} from "src/util/html"
  import {toast} from "src/app/ui"

  export let label
  export let value

  const copy = () => {
    copyToClipboard(value)
    toast.show("info", `${label} copied to clipboard!`)
  }
</script>

<strong>{label}</strong>
<div class="flex items-center gap-2 font-mono text-sm">
  <i class="fa-solid fa-copy cursor-pointer" on:click={copy} />
  {value.length > 80 ? value.slice(0, 50) + "..." : value}
</div>
