<script lang="ts">
  import QRCode from "qrcode"
  import {onMount} from "svelte"
  import Input from "src/partials/Input.svelte"
  import {copyToClipboard} from "src/util/html"
  import {toast} from "src/partials/state"

  export let code

  let canvas

  const copy = () => {
    copyToClipboard(code)
    toast.show("info", "The QR Code has been copied to your clipboard.")
  }

  onMount(() => {
    QRCode.toCanvas(canvas, code)
  })
</script>

<div
  class="m-auto flex max-w-sm flex-col gap-4 rounded border border-solid border-gray-6 bg-gray-8 p-4">
  <canvas class="m-auto rounded" bind:this={canvas} />
  <Input value={code}>
    <button slot="after" class="fa fa-copy" on:click={copy} />
  </Input>
</div>
