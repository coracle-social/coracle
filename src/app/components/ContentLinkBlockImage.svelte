<script lang="ts">
  import {onMount, onDestroy} from "svelte"
  import {displayUrl} from "@welshman/lib"
  import {getTags, decryptFile, getTagValue, tagsFromIMeta} from "@welshman/util"
  import Icon from "@lib/components/Icon.svelte"
  import {imgproxy} from "@app/state"

  const {value, event, ...props} = $props()

  const url = value.url.toString()
  const meta =
    getTags("imeta", event.tags)
      .map(tagsFromIMeta)
      .find(meta => getTagValue("url", meta) === url) || event.tags

  const key = getTagValue("decryption-key", meta)
  const nonce = getTagValue("decryption-nonce", meta)
  const algorithm = getTagValue("encryption-algorithm", meta)

  const onError = () => {
    hasError = true
  }

  let hasError = $state(false)
  let src = $state(imgproxy(url))

  onMount(async () => {
    if (algorithm === "aes-gcm" && key && nonce) {
      const response = await fetch(url)

      if (response.ok) {
        const ciphertext = new Uint8Array(await response.arrayBuffer())
        const decryptedData = await decryptFile({ciphertext, key, nonce, algorithm})

        src = URL.createObjectURL(new Blob([decryptedData]))
      }
    }
  })

  onDestroy(() => {
    URL.revokeObjectURL(src)
  })
</script>

{#if hasError}
  <a href={url} class="link-content whitespace-nowrap">
    <Icon icon="link-round" size={3} class="inline-block" />
    {displayUrl(url)}
  </a>
{:else}
  <img alt="" {src} onerror={onError} {...props} />
{/if}
