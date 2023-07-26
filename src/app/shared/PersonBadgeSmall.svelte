<script>
  import cx from "classnames"
  import {Link} from "svelte-routing"
  import {killEvent} from "src/util/html"
  import {routes} from "src/app/state"
  import {Directory} from "src/app/engine"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"

  export let pubkey
  export let inert = false

  const display = Directory.displayPubkey(pubkey)
</script>

{#if inert}
  <span class={cx($$props.class, "relative z-10 flex items-center gap-2")}>
    <PersonCircle {pubkey} />
    <span>{display}</span>
  </span>
{:else}
  <Link
    to={routes.person(pubkey)}
    class={cx($$props.class, "relative z-10 flex items-center gap-2")}
    on:click={killEvent}>
    <PersonCircle {pubkey} />
    <span>{display}</span>
  </Link>
{/if}
