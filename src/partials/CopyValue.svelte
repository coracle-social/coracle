<script lang="ts">
  import {copyToClipboard} from "src/util/html"
  import {toast} from "src/partials/state"
  import Popover from "src/partials/Popover.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import {router} from "src/app/router"

  export let value
  export let label
  export let encode = null
  export let isPassword = false

  let showEncoded = true

  $: displayValue = showEncoded && encode ? encode(value) : value

  const copy = () => {
    copyToClipboard(displayValue)
    toast.show("info", `${label || "Contents"} copied to clipboard!`)
  }

  const share = () => router.at("qrcode").at(displayValue).open()
</script>

<div class="flex flex-col gap-2">
  <div class="flex items-center justify-between">
    <strong class="flex-grow">
      <slot name="label">
        {label}
      </slot>
    </strong>
    {#if encode}
      <Popover triggerType="mouseenter">
        <div slot="trigger">
          <Toggle bind:value={showEncoded} />
        </div>
        <span slot="tooltip">Show {showEncoded ? "raw" : "encoded"} version</span>
      </Popover>
    {/if}
  </div>
  <div class="flex min-w-0 gap-4 font-mono text-sm">
    <div class="flex gap-4 p-1">
      <i class="fa-solid fa-copy cursor-pointer" on:click={copy} />
      {#if !isPassword}
        <i class="fa-solid fa-qrcode cursor-pointer" on:click={share} />
      {/if}
    </div>
    <p class="min-w-0 overflow-hidden text-ellipsis">
      {isPassword ? displayValue.toString().replace(/./g, "•") : displayValue}
    </p>
  </div>
</div>
