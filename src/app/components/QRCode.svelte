<script lang="ts">
  import QRCode from "qrcode"
  import {onMount} from "svelte"
  import Button from "@lib/components/Button.svelte"
  import {clip} from "@app/toast"

  const {code, ...props} = $props()

  let canvas: Element | undefined = $state()
  let wrapper: Element | undefined = $state()
  let scale = $state(0.1)
  let height = $state(0)

  const copy = () => clip(code)

  onMount(() => {
    if (canvas && wrapper) {
      QRCode.toCanvas(canvas, code)

      const wrapperRect = wrapper.getBoundingClientRect()
      const canvasRect = canvas.getBoundingClientRect()

      scale = wrapperRect.width / (canvasRect.width * 10)
      height = canvasRect.width * 10 * scale
    }
  })
</script>

<Button class="max-w-full {props.class}" onclick={copy}>
  <div bind:this={wrapper} style={`height: ${height}px`}>
    <canvas
      class="rounded-box"
      bind:this={canvas}
      style={`transform-origin: top left; transform: scale(${scale}, ${scale})`}>
    </canvas>
  </div>
</Button>
