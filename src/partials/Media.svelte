<script lang="ts">
  import {last} from "ramda"
  import {ellipsize, Fetch} from "hurdak"
  import {AudioController} from "src/util/audio"
  import Audio from "src/partials/Audio.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import {dufflepud, imgproxy} from "src/engine"

  export let link
  export let onClick = null
  export let onClose = null

  const loadPreview = async () => {
    const json = await Fetch.postJson(dufflepud("link/preview"), {url: link.url})

    if (!json.title && !json.image) {
      throw new Error("Unable to load preview")
    }

    return json
  }
</script>

{#if link.type === "audio"}
  <Audio controller={new AudioController(link.url)} />
{:else}
  <Anchor
    external
    type="unstyled"
    href={onClick ? null : link.url}
    on:click={onClick}
    style="background-color: rgba(15, 15, 14, 0.5)"
    class="relative flex flex-col overflow-hidden rounded-xl border border-solid border-gray-6">
    {#if link.type === "image"}
      <img
        alt="Link preview"
        src={imgproxy(link.url)}
        class="max-h-96 object-contain object-center" />
    {:else if link.type === "spotify"}
      {@const id = last(link.url.split("?")[0].match(/[a-z]+\/[0-9A-z]+$/))}
      {@const src = `https://open.spotify.com/embed/${id}`}
      <iframe
        {src}
        allowfullscreen
        style="border-radius:12px"
        width="100%"
        height="352"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy" />
    {:else if link.type === "video"}
      <video controls src={link.url} class="max-h-96 object-contain object-center" />
    {:else}
      {#await loadPreview()}
        <Spinner />
      {:then { title, description, image }}
        {#if image}
          <img
            alt="Link preview"
            src={imgproxy(image)}
            class="max-h-96 object-contain object-center" />
        {/if}
        <div class="h-px bg-gray-6" />
        {#if title}
          <div class="flex flex-col bg-white px-4 py-2 text-black">
            <strong class="overflow-hidden text-ellipsis whitespace-nowrap">{title}</strong>
            <small>{ellipsize(description, 140)}</small>
          </div>
        {/if}
      {:catch}
        <p class="mb-1 px-12 py-24 text-center text-gray-5">
          Unable to load a preview for {link.url}
        </p>
      {/await}
    {/if}
    {#if onClose}
      <div
        on:click|preventDefault={onClose}
        class="absolute right-0 top-0 m-1 flex h-6 w-6 cursor-pointer items-center justify-center
         rounded-full border border-solid border-gray-6 bg-white text-black opacity-50 shadow">
        <i class="fa fa-times" />
      </div>
    {/if}
  </Anchor>
{/if}
