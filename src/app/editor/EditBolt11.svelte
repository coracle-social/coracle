<script lang="ts">
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"
  import QRCode from "qrcode"
  import {onMount} from "svelte"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {showInfo} from "src/partials/Toast.svelte"
  import {copyToClipboard} from "src/util/html"

  export let node: NodeViewProps["node"]
  export let selected: NodeViewProps["selected"]

  export let href = null
  export let onClick = null
  export let copyOnClick = true

  let canvas, wrapper
  let scale = 0.1
  let height = null

  const copy = () => {
    copyToClipboard(node.attrs.lnbc)
    showInfo("Copied to clipboard!")
  }

  onMount(() => {
    console.log("debug bolt11", node)
    QRCode.toCanvas(canvas, node.attrs.lnbc)

    const wrapperRect = wrapper.getBoundingClientRect()
    const canvasRect = canvas.getBoundingClientRect()

    scale = wrapperRect.width / (canvasRect.width * 10)
    height = canvasRect.width * 10 * scale
  })
</script>

<NodeViewWrapper class="inline">
  <div class="rounded-xl border border-solid border-neutral-600 bg-neutral-800 p-2">
    <div class="m-auto flex max-w-sm flex-col gap-2">
      <Anchor external {href} on:click={onClick || (copyOnClick ? copy : null)}>
        <div bind:this={wrapper} style={`height: ${height}px`}>
          <canvas
            class="rounded-xl"
            bind:this={canvas}
            style={`transform-origin: top left; transform: scale(${scale}, ${scale})`} />
        </div>
      </Anchor>
      <slot name="below" {copy}>
        <Input value={node.attrs.lnbc}>
          <button slot="after" class="fa fa-copy" on:click={copy} />
        </Input>
      </slot>
    </div>
  </div>
</NodeViewWrapper>
