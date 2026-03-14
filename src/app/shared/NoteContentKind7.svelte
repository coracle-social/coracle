<script lang="ts">
  import {parse, isEmoji, renderAsHtml} from "@welshman/content"
  import Icon from "src/partials/Icon.svelte"
  import NoteContentEmoji from "src/app/shared/NoteContentEmoji.svelte"

  export let note

  $: zenAmount = parseZenAmount(note.content)
</script>

{#if note.content === "+" || note.content === ""}
  <Icon icon="heart" />
{:else if note.content === "-"}
  <Icon icon="thumbs-down" />
{:else if zenAmount > 1}
  <span class="inline-flex items-center gap-1">
    <Icon icon="heart" />
    <span class="font-mono text-accent text-sm">+{zenAmount}Ẑ</span>
  </span>
{:else}
  {#each parse(note) as parsed}
    {#if isEmoji(parsed)}
      <NoteContentEmoji {...parsed.value} />
    {:else}
      {@html renderAsHtml(parsed)}
    {/if}
  {/each}
{/if}

<script context="module">
  function parseZenAmount(content) {
    if (!content) return 0
    const match = content.match(/^\+(\d+)$/)
    return match ? parseInt(match[1], 10) : 0
  }
</script>
