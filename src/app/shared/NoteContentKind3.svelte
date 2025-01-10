<script lang="ts">
  import {take} from "@welshman/lib"
  import {getPubkeyTagValues} from "@welshman/util"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import PersonBadgeSmall from "src/app/shared/PersonBadgeSmall.svelte"
  import NoteContentEllipsis from "src/app/shared/NoteContentEllipsis.svelte"

  export let note
  export let showEntire

  const expand = () => {
    limit += 20
  }

  let limit = showEntire ? Infinity : 5

  $: isSliced = getPubkeyTagValues(note.tags).length > limit
</script>

<FlexColumn small>
  <div
    style={!showEntire &&
      isSliced &&
      "mask-image: linear-gradient(0deg, transparent 0px, black 100px)"}>
    <div class="mb-4 border-l-2 border-solid border-neutral-600 pl-4 text-lg">
      Updated follow list:
    </div>
    <div>
      {#each take(limit, getPubkeyTagValues(note.tags)) as pubkey}
        <div class="inline-block rounded-full px-3 py-2 transition-colors hover:bg-neutral-800">
          <PersonBadgeSmall {pubkey} />
        </div>
      {/each}
    </div>
  </div>
  {#if !showEntire && isSliced}
    <NoteContentEllipsis on:click={expand} />
  {/if}
</FlexColumn>
