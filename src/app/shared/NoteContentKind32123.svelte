<script lang="ts">
  import {annotateMedia} from "src/util/misc"
  import Card from "src/partials/Card.svelte"
  import Media from "src/partials/Media.svelte"

  export let note

  const {title, creator, enclosure, link} = JSON.parse(note.content)
</script>

<Card interactive class="flex flex-col gap-4" on:click={() => window.open(link)}>
  <p class="staatliches text-xl">{title} | {creator}</p>
  <Media link={annotateMedia(enclosure)} />
</Card>
