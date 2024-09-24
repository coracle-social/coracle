<script lang="ts">
  import Content from "@app/components/Content.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"

  export let root
  export let replies
</script>

<div>
  <NoteCard event={root} class="card2">
    <div class="ml-12">
      <Content event={root} />
    </div>
  </NoteCard>
  {#if replies.length > 0}
    Show {replies.length} {replies.length === 1 ? "reply" : "replies"}
  {/if}
</div>
