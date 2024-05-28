<script lang="ts">
  import cx from "classnames"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {router} from "src/app/util/router"
  import {displayProfile} from "src/domain"
  import {deriveProfile} from "src/engine"

  export let pubkey
  export let inert = false

  const profile = deriveProfile(pubkey)
</script>

{#if inert}
  <span class={cx($$props.class, "relative z-feature flex items-center gap-2")}>
    <PersonCircle {pubkey} />
    <span>{displayProfile($profile)}</span>
  </span>
{:else}
  <Anchor
    modal
    href={router.at("people").of(pubkey).toString()}
    class={cx($$props.class, "relative z-feature flex items-center gap-2")}>
    <PersonCircle {pubkey} />
    <span>{displayProfile($profile)}</span>
  </Anchor>
{/if}
