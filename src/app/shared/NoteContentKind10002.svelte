<script lang="ts">
  import {Tags} from "src/util/nostr"
  import Content from "src/partials/Content.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"

  export let note

  const tags = Tags.from(note).type("r").all()
</script>

<Content gap="gap-2" class="m-0">
  <p>New relay selections:</p>
  {#each tags as [_, url, mode]}
    <RelayCard relay={{url}} />
  {/each}
</Content>
