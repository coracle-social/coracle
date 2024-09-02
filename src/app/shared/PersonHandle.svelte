<script lang="ts">
  import cx from "classnames"
  import {deriveProfile, deriveHandle, displayHandle} from "@welshman/app"

  export let pubkey

  const profile = deriveProfile(pubkey)

  $: handle = deriveHandle($profile?.nip05)
</script>

{#if $handle}
  <div class={cx($$props.class, "overflow-hidden overflow-ellipsis opacity-75")}>
    {displayHandle($handle)}
  </div>
{/if}
