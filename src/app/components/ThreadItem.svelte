<script lang="ts">
  import Content from "@app/components/Content.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"

  export let event
</script>

<div class="flex flex-col items-end">
  <NoteCard {event} class="card2 bg-alt w-full">
    <div class="ml-12">
      <Content {event} />
    </div>
  </NoteCard>
</div>
