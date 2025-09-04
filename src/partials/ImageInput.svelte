<script lang="ts">
  import {displayUrl, first} from "@welshman/lib"
  import {getTagValue, getListTags} from "@welshman/util"
  import {userBlossomServers} from "@welshman/app"
  import Input from "src/partials/Input.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Button from "src/partials/Button.svelte"
  import {showWarning} from "src/partials/Toast.svelte"
  import {ensureProto} from "src/util/misc"
  import type {CompressorOpts} from "src/util/html"
  import {listenForFile} from "src/util/html"
  import {env, uploadFile} from "src/engine"

  export let icon = null
  export let value = null
  export let opts: CompressorOpts = {}

  const url = ensureProto(
    getTagValue("server", getListTags($userBlossomServers)) || first(env.BLOSSOM_URLS),
  )

  let input, loading
  let isOpen = false

  $: {
    if (input) {
      listenForFile(input, async inputFiles => {
        if (inputFiles) {
          loading = true

          try {
            const result = await uploadFile(url, inputFiles[0], opts)

            value = result.url
          } catch (e) {
            console.error(e)
            showWarning(e.toString())
          } finally {
            isOpen = false
            loading = false
          }
        }
      })
    }
  }

  const decline = () => {
    isOpen = false
  }
</script>

<div class="flex gap-2">
  {#if icon}
    <Input type="text" class="flex-grow" bind:value placeholder="https://">
      <i slot="before" class={`fa fa-${icon}`} />
    </Input>
  {/if}
  <Button
    on:click={() => {
      isOpen = true
    }}>
    <slot name="button">
      <div class="btn">
        <i class="fa fa-upload" />
      </div>
    </slot>
  </Button>
</div>

{#if isOpen}
  <Modal mini onEscape={decline}>
    {#if loading}
      <Spinner delay={0}>Uploading files to {displayUrl(url)}</Spinner>
    {:else}
      <h1 class="staatliches text-2xl">Upload a File</h1>
      <div class="flex flex-col gap-2">
        <p>Click below to select a file to upload.</p>
        <p class="text-gray-3 text-sm">
          <i class="fa fa-warning" />
          Note that images are stored unencrypted and publicly accessible.
        </p>
      </div>
      <input type="file" bind:this={input} />
    {/if}
  </Modal>
{/if}
