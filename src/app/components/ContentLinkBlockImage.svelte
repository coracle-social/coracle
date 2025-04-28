<script lang="ts">
  import {onDestroy} from "svelte"
  import {now} from "@welshman/lib"
  import {BLOSSOM_AUTH, makeEvent, getTags, getTagValue, tagsFromIMeta} from "@welshman/util"
  import {signer} from "@welshman/app"
  import {imgproxy} from "@app/state"

  const {value, event} = $props()

  const url = value.url.toString()

  // If we fail to fetch the image, try authenticating if we have a blossom hash
  const onerror = async () => {
    const meta = getTags("imeta", event.tags)
      .map(tagsFromIMeta)
      .find(meta => getTagValue("url", meta) === url)
    const hash = meta ? getTagValue("x", meta) : undefined

    if (hash && $signer) {
      const event = await signer.get().sign(
        makeEvent(BLOSSOM_AUTH, {
          tags: [
            ["t", "get"],
            ["x", hash],
            ["expiration", String(now() + 30)],
          ],
        }),
      )

      const res = await fetch(url, {
        headers: {
          Authorization: `Nostr ${btoa(JSON.stringify(event))}`,
        },
      })

      if (res.status === 200) {
        src = URL.createObjectURL(await res.blob())
      }
    }
  }

  let src = $state(imgproxy(url))

  onDestroy(() => {
    URL.revokeObjectURL(src)
  })
</script>

<img alt="" {src} {onerror} class="m-auto max-h-96 rounded-box" />
