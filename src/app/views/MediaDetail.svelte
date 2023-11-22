<script lang="ts">
  import Content from "src/partials/Content.svelte"
  import Media from "src/partials/Media.svelte"

  export let url
</script>

<Content>
  <Media fullSize {url} />
</Content>
