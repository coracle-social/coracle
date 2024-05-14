<script lang="ts">
  import cx from 'classnames'
  import {copyToClipboard} from "src/util/html"
  import {showInfo} from "src/partials/Toast.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import {router} from "src/app/util/router"

  export let value
  export let label = "Contents"

  const copy = () => {
    copyToClipboard(value)
    showInfo(`${label} copied to clipboard!`)
  }

  const share = () => router.at("qrcode").at(value).open()
</script>

<div class={cx($$props.class, "flex gap-2 items-center")}>
  <i class="fa-solid fa-copy cursor-pointer" on:click={copy} />
  <i class="fa-solid fa-qrcode cursor-pointer" on:click={share} />
</div>
