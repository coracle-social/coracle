<script lang="ts">
  import {displayGroupMeta} from "src/domain"
  import {deriveGroupMeta} from "src/engine"

  export let address

  const meta = deriveGroupMeta(address)
</script>

<span class={$$props.class}>{displayGroupMeta($meta)}</span>
