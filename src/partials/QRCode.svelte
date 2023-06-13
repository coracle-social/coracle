<script lang="ts">
  import cx from "classnames"
  import QRCode from "qrcode"
  import {onMount} from "svelte"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {copyToClipboard} from "src/util/html"
  import {toast} from "src/partials/state"

  export let code
  export let onClick = "navigate"
  export let fullWidth = false

  let canvas

  const copy = () => {
    copyToClipboard(code)
    toast.show("info", "Copied to clipboard!")
  }

  onMount(() => {
    QRCode.toCanvas(canvas, code)
  })
</script>

<div
  class={cx("rounded-xl border border-solid border-gray-6 bg-gray-8 p-4", {
    "m-auto max-w-sm": !fullWidth,
  })}>
  <div class="m-auto flex max-w-sm flex-col gap-4">
    <Anchor
      external
      href={onClick === "navigate" ? code : null}
      on:click={onClick === "copy" ? copy : null}>
      <canvas class="m-auto rounded-xl" bind:this={canvas} />
    </Anchor>
    {#if onClick === "navigate"}
      <Input value={code}>
        <button slot="after" class="fa fa-copy" on:click={copy} />
      </Input>
    {/if}
  </div>
</div>
