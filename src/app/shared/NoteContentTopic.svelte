<script lang="ts">
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"

  export let value

  const openTopic = topic => {
    modal.push({type: "topic/feed", topic})
  }
</script>

<Anchor class="underline" killEvent on:click={() => openTopic(value)}>#{value}</Anchor>
