<script lang="ts">
  import cx from "classnames"
  import Image from "src/partials/Image.svelte"
  import {imgproxy} from "src/engine"

  export let url
  export let alt = "Link preview"
  export let fullSize = false

  const src = imgproxy(url)
  const className = cx("object-contain object-center", {"max-h-96": !fullSize})
</script>

<Image {src} {alt} class={className} />
