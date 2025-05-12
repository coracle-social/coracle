<script lang="ts">
  import {parse, isEmoji, renderAsHtml} from "@welshman/content"
  import Icon from "src/partials/Icon.svelte"
  import NoteContentEmoji from "src/app/shared/NoteContentEmoji.svelte"

  export let note
</script>

{#if note.content === "+" || note.content === ""}
  <Icon icon="heart" />
{:else if note.content === "-"}
  <Icon icon="thumbs-down" />
{:else}
  {#each parse(note) as parsed}
    {#if isEmoji(parsed)}
      <NoteContentEmoji {...parsed.value} />
    {:else}
      {@html renderAsHtml(parsed)}
    {/if}
  {/each}
{/if}
