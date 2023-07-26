<script>
  import cx from "classnames"
  import {Link} from "svelte-routing"
  import {killEvent} from "src/util/html"
  import {routes} from "src/app/state"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import PersonHandle from "src/app/shared/PersonHandle.svelte"

  export let pubkey
  export let inert = false
</script>

{#if inert}
  <div class={cx($$props.class, "relative z-10 flex gap-4")}>
    <PersonCircle size={12} {pubkey} />
    <div class="flex flex-col" style="min-width: 48px;">
      <PersonName {pubkey} />
      <PersonHandle {pubkey} />
    </div>
  </div>
{:else}
  <Link
    to={routes.person(pubkey)}
    on:click={killEvent}
    class={cx($$props.class, "relative z-10 flex gap-4")}>
    <PersonCircle size={12} {pubkey} />
    <div class="flex flex-col" style="min-width: 48px;">
      <PersonName {pubkey} />
      <PersonHandle {pubkey} />
    </div>
  </Link>
{/if}
