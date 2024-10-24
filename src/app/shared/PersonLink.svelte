<script lang="ts">
  import cx from "classnames"
  import {deriveProfileDisplay} from "@welshman/app"
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/util/router"

  export let pubkey
  export let underline = true

  const path = router.at("people").of(pubkey).toString()
  const display = deriveProfileDisplay(pubkey)
</script>

<Anchor modal stopPropagation class={$$props.class} href={path}>
  @<span class={cx({underline})}>{$display}</span>
</Anchor>
