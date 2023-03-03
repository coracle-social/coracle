<script lang="ts">
  import QRCode from 'qrcode'
  import {onMount} from 'svelte'
  import Input from 'src/partials/Input.svelte'
  import {copyToClipboard} from "src/util/html"
  import {toast} from 'src/app/ui'

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

<div class="rounded bg-black border border-solid border-medium p-4 flex flex-col gap-4 max-w-sm m-auto">
  <canvas class="m-auto rounded" bind:this={canvas} />
  <Input value={code}>
    <button slot="after" class="fa fa-copy" on:click={copy} />
  </Input>
</div>
