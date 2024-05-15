<script lang="ts">
  import cx from "classnames"
  import {copyToClipboard} from "src/util/html"
  import {showInfo} from "src/partials/Toast.svelte"
  import {router} from "src/app/util/router"

  export let value
  export let label = "Contents"

  const copy = () => {
    copyToClipboard(value)
    showInfo(`${label} copied to clipboard!`)
  }

  const share = () => router.at("qrcode").at(value).open()
</script>

<div class={cx($$props.class, "flex items-center gap-1")}>
  <div class="cursor-pointer px-1 text-neutral-400 transition-colors hover:text-neutral-100">
    <i class="fa-solid fa-copy" on:click={copy} />
  </div>
  <div class="cursor-pointer px-1 text-neutral-400 transition-colors hover:text-neutral-100">
    <i class="fa-solid fa-qrcode" on:click={share} />
  </div>
</div>
