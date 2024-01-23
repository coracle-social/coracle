<script lang="ts">
  import EventInfo from "src/app/shared/EventInfo.svelte"

  export let note
</script>

<EventInfo showDate actionsInline event={note} />
