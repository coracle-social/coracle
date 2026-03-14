<script lang="ts">
  import {ellipsize, postJson} from "@welshman/lib"
  import {dufflepud, imgproxy, getSetting} from "src/engine"

  export let url: string

  const fetchOGMetadata = async (targetUrl: string) => {
    const res = await fetch(targetUrl, {signal: AbortSignal.timeout(5000)})
    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, "text/html")
    const og = (name: string) =>
      doc.querySelector(`meta[property="og:${name}"]`)?.getAttribute("content")
    const title = og("title") || doc.querySelector("title")?.textContent
    const description = og("description")
    const image = og("image")

    if (!title && !image) throw new Error("No OG metadata found")

    return {title, description, image}
  }

  const loadPreview = async () => {
    // Try Dufflepud first if configured
    const dufflepudUrl = getSetting("dufflepud_url")
    if (dufflepudUrl) {
      try {
        const json = await postJson(dufflepud("link/preview"), {url})
        if (json?.title || json?.image) return json
      } catch {}
    }

    // Client-side fallback: fetch URL directly and parse OG tags
    return await fetchOGMetadata(url)
  }

  const onError = () => {
    hideImage = true
  }

  let hideImage = false
</script>

<div
  class="flex h-full w-full max-w-[95vw] flex-col justify-center overflow-hidden rounded bg-neutral-800">
  {#await loadPreview()}
    <div class="shimmer h-64 w-96" />
  {:then { title, description, image }}
    {#if image && !hideImage}
      <img
        alt="Link preview"
        src={imgproxy(image)}
        on:error={onError}
        class="h-full max-h-96 w-full object-cover" />
    {/if}
    {#if image && !hideImage && title}
      <div class="h-px bg-neutral-600" />
    {/if}
    {#if title}
      <div class="flex flex-col bg-white px-4 py-2 text-black" style="overflow-wrap: anywhere">
        <strong>{title}</strong>
        <small>{ellipsize(description, 140)}</small>
      </div>
    {/if}
  {:catch}
    <p class="mb-1 p-12 text-center text-neutral-300">
      Unable to load a preview for {url}
    </p>
  {/await}
</div>
