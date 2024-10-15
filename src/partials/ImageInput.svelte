<script lang="ts">
  import {createEventDispatcher, onMount} from "svelte"
  import {displayList} from "hurdak"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {listenForFile} from "src/util/html"
  import {uploadFiles, getSetting} from "src/engine"

  export let compose = null
  export let textarea = null

  export let icon = null
  export let value = null
  export let multi = false
  export let maxWidth = null
  export let maxHeight = null
  export let hostLimit = 1

  const urls = getSetting("nip96_urls").slice(0, hostLimit)
  const dispatch = createEventDispatcher()

  let input

  onMount(() => {
    if (input) {
      listenForFile(input, async inputFiles => {
        if (inputFiles) {
          let uploadContent = ""
          // if the compose props is passed in, alter the content to show an upload is being processed
          if (compose || textarea) {
            uploadContent = inputFiles.reduce(
              (acc, cur) => acc + "\n![Uploading " + cur.name + " using " + displayList(urls) + "]",
              "",
            )
          }
          if (compose) {
            compose.write(uploadContent)
          }
          if (textarea) {
            textarea.value = textarea.value.concat(uploadContent)
          }
          try {
            for (const tags of await uploadFiles(urls, inputFiles, {
              maxWidth,
              maxHeight,
            })) {
              // For inputs that only want one file
              value = tags.get("url")?.value()

              if (value) {
                dispatch("change", tags)
              }
            }
            if (compose) {
              const content = compose.parse()
              compose.clear()
              compose.write(content.replace(uploadContent.trim(), ""))
            }
            if (textarea) {
              textarea.value = textarea.value.replace(uploadContent.trim(), "").trim()
            }
          } catch (e) {
            if (compose) {
              const content = compose.parse()
              compose.clear()
              compose.write(content.replace(uploadContent.trim(), ""))
            }
            if (textarea) {
              textarea.value = textarea.value.replace(uploadContent.trim(), "").trim()
            }
          }
        }
      })
    }
  })
</script>

<div class="flex gap-2">
  {#if icon}
    <Input type="text" class="flex-grow" bind:value placeholder="https://">
      <i slot="before" class={`fa fa-${icon}`} />
    </Input>
  {/if}
  <div
    on:click={() => {
      input.click()
    }}>
    <slot name="button">
      <div class="flex">
        <Anchor button>
          <i class="fa fa-upload" />
        </Anchor>
      </div>
    </slot>
  </div>
</div>

<input multiple={multi} type="file" bind:this={input} class="absolute h-0 w-0 opacity-0" />
