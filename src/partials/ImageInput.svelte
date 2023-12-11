<script lang="ts">
  import {createEventDispatcher} from "svelte"
  import {displayList} from "hurdak"
  import Input from "src/partials/Input.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {listenForFile} from "src/util/html"
  import {uploadFiles, settings} from "src/engine"

  export let icon = null
  export let value = null
  export let multi = false
  export let maxWidth = null
  export let maxHeight = null
  export let hostLimit = 1

  const urls = $settings.nip96_urls.slice(0, hostLimit)
  const dispatch = createEventDispatcher()

  let input, listener, loading
  let isOpen = false

  $: {
    if (input) {
      listener = listenForFile(input, async inputFiles => {
        if (inputFiles) {
          loading = true

          try {
            for (const tags of await uploadFiles(urls, inputFiles, {
              maxWidth,
              maxHeight,
            })) {
              // For inputs that only want one file
              value = tags.type("url").values().first()

              if (value) {
                dispatch("change", tags)
              }
            }
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
    <Input type="text" wrapperClass="flex-grow" bind:value placeholder="https://" class="rounded-full">
      <i slot="before" class={`fa fa-${icon}`} />
    </Input>
  {/if}
  <div
    on:click={() => {
      isOpen = true
    }}>
    <slot name="button">
      <div class="flex">
        <Anchor circle button>
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
        <Spinner delay={0}>Uploading files using: {displayList(urls)}</Spinner>
      {:else}
        <h1 class="staatliches text-2xl">Upload a File</h1>
        <div class="flex flex-col gap-2">
          <p>Click below to select a file to upload.</p>
          <p class="text-sm text-gray-3">
            <i class="fa fa-warning" />
            Note that images are stored unencrypted and publicly accessible.
          </p>
        </div>
        <input multiple={multi} type="file" bind:this={input} />
      {/if}
    </Content>
  </Modal>
{/if}
