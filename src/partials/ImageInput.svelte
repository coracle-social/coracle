<script lang="ts">
  import {identity} from "ramda"
  import {filterVals} from "hurdak"
  import Input from "src/partials/Input.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {listenForFile, stripExifData, blobToFile} from "src/util/html"
  import {uploadToMediaProvider, getSettings, createNIP94} from "src/engine"
  import { Tags } from "src/util/nostr"

  export let icon = null
  export let value = null
  export let multi = false
  export let maxWidth = null
  export let maxHeight = null
  export let onChange = null

  let input, listener, loading
  let files = []
  let isOpen = false
  let settings = getSettings()

  let selectedServers = [] 
  for (const server of settings.nip96_url) {
    selectedServers.push(server.url)
  }

  $: {
    if (input) {
      listener = listenForFile(input, async inputFiles => {
        if (inputFiles) {
          const opts = filterVals(identity, {maxWidth, maxHeight})

          loading = true

          try {
            files = await Promise.all(
              inputFiles.map(async f => {
                if (f.type.match("image/(webp|gif)")) {
                  return f
                }

                return blobToFile(await stripExifData(f, opts))
              })
            )

            const results = await Promise.all(
              files.map(async file => {
                const body = new FormData()

                body.append("file[]", file)
                
                let nip94Events = []
                for (const server of settings.nip96_url) {
                  try{
                    let result = await uploadToMediaProvider(server.url, body)
                    nip94Events.push(result)
                  } catch (e) {
                    console.error(e)
                  }
                }
                console.debug(await createNIP94(nip94Events))
                return Tags.from(nip94Events).type("url").values().first()
              })
            )

           for (const result of results) {
              if (result) {
                value = result
                onChange?.(value)
              }
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
        <Spinner delay={0}>Uploading files using the following servers: {selectedServers}</Spinner>
      {:else}
        <h1 class="staatliches text-2xl">Upload a File</h1>
        <p>Click below to select a file to upload.</p>
        <input multiple={multi} type="file" bind:this={input} />
      {/if}
    </Content>
  </Modal>
{/if}
