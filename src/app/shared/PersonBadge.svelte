<script lang="ts">
  import cx from "classnames"
  import {routes} from "src/app/state"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import PersonHandle from "src/app/shared/PersonHandle.svelte"

  export let pubkey
  export let inert = false
  export let size = 12
</script>

{#if inert}
  <div class={cx($$props.class, "relative z-10 flex gap-4")}>
    <PersonCircle {size} {pubkey} />
    <div class="flex flex-col" style="min-width: 48px;">
      <PersonName {pubkey} />
      <PersonHandle {pubkey} />
    </div>
  </div>
{:else}
  <Anchor
    killEvent
    href={routes.person(pubkey)}
    class={cx($$props.class, "relative z-10 flex gap-4")}>
    <PersonCircle {size} {pubkey} />
    <div class="flex flex-col" style="min-width: 48px;">
      <PersonName {pubkey} />
      <PersonHandle {pubkey} />
    </div>
  </Anchor>
{/if}
