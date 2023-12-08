<script lang="ts">
  import cx from "classnames"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {router} from "src/app/router"
  import {displayPubkey} from "src/engine"

  export let pubkey
  export let inert = false
</script>

{#if inert}
  <span class={cx($$props.class, "relative z-feature flex items-center gap-2")}>
    <PersonCircle {pubkey} />
    <span>{displayPubkey(pubkey)}</span>
  </span>
{:else}
  <Anchor
    href={router.at("people").of(pubkey).toString()}
    class={cx($$props.class, "relative z-feature flex items-center gap-2")}>
    <PersonCircle {pubkey} />
    <span>{displayPubkey(pubkey)}</span>
  </Anchor>
{/if}
