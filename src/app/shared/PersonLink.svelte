<script lang="ts">
  import cx from "classnames"
  import {deriveProfileDisplay} from "@welshman/app"
  import Link from "src/partials/Link.svelte"
  import {router} from "src/app/util/router"

  export let pubkey
  export let underline = true

  const path = router.at("people").of(pubkey).toString()
  const display = deriveProfileDisplay(pubkey)
</script>

<Link modal class={$$props.class} href={path}>
  @<span class={cx({underline})}>{$display}</span>
</Link>
