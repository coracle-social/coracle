<script lang="ts">
  import {identity} from "ramda"
  import {filterVals} from "hurdak"
  import Input from "src/partials/Input.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {listenForFile, stripExifData, blobToFile} from "src/util/html"
  import {uploadToNostrBuild} from "src/engine"

  export let icon = null
  export let value = null
  export let multi = false
  export let maxWidth = null
  export let maxHeight = null
  export let onChange = null

  let input, listener, loading
  let files = []
  let isOpen = false

  $: {
    if (input) {
      listener = listenForFile(input, async inputFiles => {
        if (inputFiles) {
          const opts = filterVals(identity, {maxWidth, maxHeight})

          loading = true

          try {
            files = await Promise.all(
              inputFiles.map(async f => blobToFile(await stripExifData(f, opts)))
            )

            const body = new FormData()

            for (const file of files) {
              body.append("file[]", file)
            }

            const result = await uploadToNostrBuild(body)

            // Legacy weirdness
            for (const {url} of result.data) {
              value = url
              onChange?.(url)
            }
          } finally {
            isOpen = false
            loading = false
          }
        } else {
          files = []
        }
      })
    }
  }

  const decline = () => {
    files = []
    isOpen = false
  }
</script>

<div class="flex gap-2">
  {#if icon}
    <Input type="text" wrapperClass="flex-grow" bind:value placeholder="https://">
      <i slot="before" class={`fa fa-${icon}`} />
    </Input>
  {/if}
  <div
    on:click={() => {
      isOpen = true
    }}>
    <slot name="button">
      <div class="flex">
        <Anchor theme="button">
          <i class="fa fa-upload" />
        </Anchor>
      </div>
    </slot>
  </div>
</div>

{#if isOpen}
  <Modal mini onEscape={decline}>
    <Content>
      {#if loading}
        <Spinner delay={0}>Uploading your media...</Spinner>
      {:else}
        <h1 class="staatliches text-2xl">Upload a File</h1>
        <p>Click below to select a file to upload.</p>
        <input multiple={multi} type="file" bind:this={input} />
      {/if}
    </Content>
  </Modal>
{/if}
