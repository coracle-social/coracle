<script lang="ts">
  import {deriveRelay} from "@welshman/app"

  const {...props} = $props()

  const relay = deriveRelay(props.url)
</script>

{#if $relay?.profile?.description}
  <p class={props.class}>{$relay?.profile.description}</p>
{/if}
