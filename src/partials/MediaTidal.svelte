<script lang="ts">
  import {last} from "@welshman/lib"

  export let url

  const {pathname} = new URL(url)
  const id = last(pathname.split("/"))
  const name = pathname.includes("album") ? "albums" : "tracks"
  const src = `https://embed.tidal.com/${name}/${id}`
</script>

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
