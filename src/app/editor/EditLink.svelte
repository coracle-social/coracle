<script lang="ts">
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"
  import {last, postJson} from "@welshman/lib"
  import Anchor from "src/partials/Anchor.svelte"
  import Audio from "src/partials/Audio.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import {dufflepud, imgproxy} from "src/engine"
  import {ellipsize} from "hurdak"

  export let node: NodeViewProps["node"]
  export let selected: NodeViewProps["selected"]

  $: url = node.attrs.url

  const loadPreview = async () => {
    const json = await postJson(dufflepud("link/preview"), {url})

    if (!json?.title && !json?.image) {
      throw new Error("Failed to load link preview")
    }

    return json
  }

  function getYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  function getTwitterId(url) {
    const regExp = /^.*(twitter.com|x.com)\/\w+\/status\/(\d+)/
    const match = url.match(regExp)
    return match ? match[2] : null
  }
</script>

<NodeViewWrapper class="block">
  {#if url.match(/\.(wav|mp3|m3u8)$/)}
    {#await import("src/util/audio")}
      <span />
    {:then { AudioController }}
      <Audio controller={new AudioController(url)} />
    {/await}
  {:else}
    <Anchor
      external
      type="unstyled"
      href={url}
      class="relative flex w-full flex-grow flex-col overflow-hidden rounded-xl">
      {#if url.match(/open.spotify.com/)}
        {@const id = last(url.split("?")[0].match(/[a-z]+\/[0-9A-z]+$/))}
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
      {:else if url.match(/tidal.com/)}
        {@const {pathname} = new URL(url)}
        {@const id = last(pathname.split("/"))}
        {@const name = pathname.includes("album") ? "albums" : "tracks"}
        {@const src = `https://embed.tidal.com/${name}/${id}`}
        <iframe
          {src}
          allowfullscreen
          style="border-radius:12px"
          width="100%"
          height="100%"
          scrolling="no"
          frameBorder="0"
          allow="encrypted-media"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          title="TIDAL Embed Player"
          loading="lazy" />
      {:else if url.match(/youtube.com|youtu.be/)}
        {@const videoId = getYouTubeId(url)}
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video player"
          class="max-h-96 object-contain object-center"
          loading="lazy">
        </iframe>
      {:else if url.match(/x.com|twitter.com/)}
        {@const tweetId = getTwitterId(url)}
        {@const twt = window.twttr.widgets.load()}
        {#if tweetId}
          <blockquote class="twitter-tweet" data-dnt="true">
            <a href={`https://twitter.com/x/status/${tweetId}`}></a>
          </blockquote>
        {:else}
          <p>Invalid Twitter URL</p>
        {/if}
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
          <div class="h-px bg-neutral-600" />
          {#if title}
            <div class="flex flex-col bg-white px-4 py-2 text-black">
              <strong class="overflow-hidden text-ellipsis whitespace-nowrap">{title}</strong>
              <small>{ellipsize(description, 140)}</small>
            </div>
          {/if}
        {:catch}
          <p class="mb-1 p-12 text-center text-neutral-600">
            Unable to load a preview for {url}
          </p>
        {/await}
      {/if}
    </Anchor>
  {/if}
</NodeViewWrapper>
