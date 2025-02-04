<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import {clip} from "@app/toast"

  const {value} = $props()

  const copy = () => clip(value)
</script>

<Button onclick={copy} class="link-content">
  <Icon icon="bolt" size={3} class="inline-block translate-y-px" />
  {value.slice(0, 16)}...
</Button>
