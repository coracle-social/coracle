<script lang="ts">
  import QRCode from "qrcode"
  import {onMount} from "svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {showInfo} from "src/partials/Toast.svelte"
  import {copyToClipboard} from "src/util/html"

  export let code
  export let href = null
  export let onClick = null
  export let copyOnClick = true

  let canvas, wrapper
  let scale = 0.1
  let height = null

  const copy = () => {
    copyToClipboard(code)
    showInfo("Copied to clipboard!")
  }

  onMount(() => {
    QRCode.toCanvas(canvas, code)

    const wrapperRect = wrapper.getBoundingClientRect()
    const canvasRect = canvas.getBoundingClientRect()

    scale = wrapperRect.width / (canvasRect.width * 10)
    height = canvasRect.width * 10 * scale
  })
</script>

<Anchor external {href} on:click={onClick || (copyOnClick ? copy : null)}>
  <div bind:this={wrapper} style={`height: ${height}px`}>
    <canvas
      class="rounded-xl"
      bind:this={canvas}
      style={`transform-origin: top left; transform: scale(${scale}, ${scale})`} />
  </div>
</Anchor>
