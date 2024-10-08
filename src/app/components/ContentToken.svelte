<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import {clip} from "@app/toast"

  export let value

  const copy = () => clip(value)
</script>

<Button on:click={copy} class="link-content">
  <Icon icon="bolt" size={3} class="inline-block translate-y-px" />
  {value.slice(0, 16)}...
</Button>
