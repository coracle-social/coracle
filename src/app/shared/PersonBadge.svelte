<script>
  import cx from "classnames"
  import {Link} from "svelte-routing"
  import {killEvent} from "src/util/html"
  import {routes} from "src/app/state"
  import {directory} from "src/app/system"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"

  export let pubkey
  export let inert = false

  const profile = directory.getProfile(pubkey)
  const display = directory.displayProfile(profile)
</script>

{#if inert}
  <span class={cx($$props.class, "relative z-10 flex items-center gap-2")}>
    <PersonCircle {pubkey} />
    <span class="text-lg font-bold">{display}</span>
  </span>
{:else}
  <Link
    to={routes.person(pubkey)}
    class={cx($$props.class, "relative z-10 flex items-center gap-2")}
    on:click={killEvent}>
    <PersonCircle {pubkey} />
    <span class="text-lg font-bold">{display}</span>
  </Link>
{/if}
