<script lang="ts">
  import {annotateMedia} from "src/util/misc"
  import Content from "src/partials/Content.svelte"
  import Media from "src/partials/Media.svelte"

  export let url
</script>

<Content>
  <Media fullSize link={annotateMedia(url)} />
</Content>
