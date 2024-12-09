<script lang="ts">
  import EventInfo from "src/app/shared/EventInfo.svelte"

  export let note
</script>

<EventInfo showDate event={note} />
