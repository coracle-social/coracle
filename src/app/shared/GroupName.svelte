<script lang="ts">
  import {groups, displayGroup} from "src/engine"

  export let address

  const group = groups.key(address)
</script>

<span class={$$props.class}>{displayGroup($group)}</span>
