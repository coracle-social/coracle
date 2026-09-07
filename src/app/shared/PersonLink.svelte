<script lang="ts">
  import cx from "classnames"
  import {Profiles} from "@welshman/app"
  import {fromApp} from "src/engine/core"
  import Link from "src/partials/Link.svelte"
  import {router} from "src/app/util/router"

  export let pubkey
  export let underline = true

  const path = router.at("people").of(pubkey).toString()
  const display = fromApp($app => $app.use(Profiles).display(pubkey).$)
</script>

<Link modal class={$$props.class} href={path}>
  @<span class={cx({underline})}>{$display}</span>
</Link>
