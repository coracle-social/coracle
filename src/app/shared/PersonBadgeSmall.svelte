<script lang="ts">
  import cx from "classnames"
  import {deriveProfileDisplay} from "@welshman/app"
  import Link from "src/partials/Link.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {router} from "src/app/util/router"

  export let pubkey
  export let inert = false

  const display = deriveProfileDisplay(pubkey)
</script>

{#if inert}
  <span class={cx($$props.class, "relative z-feature flex items-center gap-2")}>
    <PersonCircle {pubkey} />
    <span>{$display}</span>
  </span>
{:else}
  <Link
    modal
    href={router.at("people").of(pubkey).toString()}
    class={cx($$props.class, "relative z-feature flex items-center gap-2")}>
    <PersonCircle {pubkey} />
    <span>{$display}</span>
  </Link>
{/if}
