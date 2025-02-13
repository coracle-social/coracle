<script lang="ts">
  import Media from "src/partials/Media.svelte"
  import Carousel from "src/partials/Carousel.svelte"
  import {router} from "src/app/util"

  export let url
  export let urls: string[] = [url]

  const onClose = () => router.pop()

  const onClick = () => window.open(urls[currentIndex], "_blank")

  let currentIndex = urls.findIndex(u => u === url)
</script>

<div class="flex h-screen w-full items-center justify-center">
  <Carousel {urls} {onClose} bind:currentIndex let:url>
    <div class="m-auto flex h-full w-full max-w-2xl items-center justify-center">
      <Media fullSize {url} onLinkClick={onClick} onImageClick={onClick} />
    </div>
  </Carousel>
</div>
