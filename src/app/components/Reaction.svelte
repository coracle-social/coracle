<script lang="ts">
  import {parse, isEmoji, renderAsHtml} from "@welshman/content"
  import Icon from "@lib/components/Icon.svelte"
  import ContentEmoji from "@app/components/ContentEmoji.svelte"

  export let event
</script>

{#if event.content === "+" || event.content === ""}
  <Icon icon="heart" />
{:else if event.content === "-"}
  <Icon icon="thumbs-down" />
{:else}
  {#each parse(event) as parsed}
    {#if isEmoji(parsed)}
      <ContentEmoji value={parsed.value} />
    {:else}
      {@html renderAsHtml(parsed)}
    {/if}
  {/each}
{/if}
