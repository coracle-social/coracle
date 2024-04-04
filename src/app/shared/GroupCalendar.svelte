<script lang="ts">
  import Calendar from "src/app/shared/Calendar.svelte"

  export let address
</script>

<Calendar group={address} filters={[{kinds: [31923], "#a": [address]}]} />
