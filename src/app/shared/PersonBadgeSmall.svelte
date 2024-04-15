<script lang="ts">
  import cx from "classnames"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {router} from "src/app/util/router"
  import {derivePerson, displayPerson} from "src/engine"

  export let pubkey
  export let inert = false

  const person = derivePerson(pubkey)
</script>

{#if inert}
  <span class={cx($$props.class, "relative z-feature flex items-center gap-2")}>
    <PersonCircle {pubkey} />
    <span>{displayPerson($person)}</span>
  </span>
{:else}
  <Anchor
    href={router.at("people").of(pubkey).toString()}
    class={cx($$props.class, "relative z-feature flex items-center gap-2")}>
    <PersonCircle {pubkey} />
    <span>{displayPerson($person)}</span>
  </Anchor>
{/if}
