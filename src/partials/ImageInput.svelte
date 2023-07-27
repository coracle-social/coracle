<script lang="ts">
  import {identity} from "ramda"
  import {Fetch, filterVals} from "hurdak"
  import Input from "src/partials/Input.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {listenForFile, stripExifData, blobToFile} from "src/util/html"
  import {Settings} from "src/app/engine"

  export let value
  export let icon
  export let maxWidth = null
  export let maxHeight = null
  export let hideInput = false
  export let onChange = null

  let input, file, listener, quote
  let loading = false
  let isOpen = false

  $: {
    if (input) {
      listener = listenForFile(input, async inputFile => {
        if (inputFile) {
          const opts = filterVals(identity, {maxWidth, maxHeight})

          file = blobToFile(await stripExifData(inputFile, opts))
          quote = await Fetch.postJson(Settings.dufflepud("upload/quote"), {
            uploads: [{size: file.size}],
          })
        } else {
          file = null
          quote = null
        }
      })
    }
  }

  const accept = async () => {
    loading = true

    try {
      const {id} = quote.uploads[0]
      const {url} = await Fetch.uploadFile(Settings.dufflepud(`upload/${id}`), file)

      value = url
      onChange?.(url)
    } finally {
      loading = false
    }

    file = null
    quote = null
    isOpen = false
  }

  const decline = () => {
    file = null
    quote = null
    isOpen = false
  }
</script>

{#if !hideInput}
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

{#if quote}
  <Modal mini onEscape={decline}>
    <Content>
      <h1 class="staatliches text-2xl">Confirm File Upload</h1>
      <p>Please accept the following terms:</p>
      <p>{quote.terms}</p>
      <div class="flex gap-2">
        <Anchor theme="button" on:click={decline} {loading}>Decline</Anchor>
        <Anchor theme="button-accent" on:click={accept} {loading}>Accept</Anchor>
      </div>
    </Content>
  </Modal>
{:else if isOpen}
  <Modal mini onEscape={decline}>
    <Content>
      <h1 class="staatliches text-2xl">Upload a File</h1>
      <p>Click below to select a file to upload.</p>
      <input type="file" bind:this={input} />
    </Content>
  </Modal>
{/if}
