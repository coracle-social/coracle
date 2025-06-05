<script lang="ts">
  import {onMount, onDestroy} from "svelte"
  import {displayUrl} from "@welshman/lib"
  import {getTags, getTagValue, tagsFromIMeta} from "@welshman/util"
  import {decryptFile} from "@welshman/editor"
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
  const encryptionAlgorithm = getTagValue("encryption-algorithm", meta)

  const onError = () => {
    hasError = true
  }

  let hasError = $state(false)
  let src = $state(imgproxy(url))

  onMount(async () => {
    if (encryptionAlgorithm === "aes-gcm" && key && nonce) {
      const response = await fetch(url)

      if (response.ok) {
        const ciphertext = new Uint8Array(await response.arrayBuffer())
        const decryptedData = decryptFile({ciphertext, key, nonce, encryptionAlgorithm})

        src = URL.createObjectURL(new Blob([new Uint8Array(decryptedData)]))
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
