<script lang="ts">
  import cx from "classnames"
  import {deriveProfileDisplay} from "@welshman/app"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"

  export let pubkey

  const display = deriveProfileDisplay(pubkey)
</script>

<span class={cx($$props.class, "relative z-feature flex items-center gap-2")}>
  <PersonCircle {pubkey} class="w-8 h-8"/>
  <PersonName {pubkey} />
</span>
