<script lang="ts">
  import cx from "classnames"
  import {routes} from "src/app/state"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {displayPubkey} from "src/engine"

  export let pubkey
  export let inert = false
</script>

{#if inert}
  <span class={cx($$props.class, "relative z-10 flex items-center gap-2")}>
    <PersonCircle {pubkey} />
    <span>{displayPubkey(pubkey)}</span>
  </span>
{:else}
  <Anchor
    killEvent
    href={routes.person(pubkey)}
    class={cx($$props.class, "relative z-10 flex items-center gap-2")}>
    <PersonCircle {pubkey} />
    <span>{displayPubkey(pubkey)}</span>
  </Anchor>
{/if}
