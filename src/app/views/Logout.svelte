<script lang="ts">
  import {clearStorage} from "@welshman/app"
  import {fly} from "src/util/transition"
  import Content from "src/partials/Content.svelte"

  clearStorage()
  localStorage.clear()

  // Do a hard refresh so everything gets totally cleared. Give them a moment to see the state
  // transition. IndexedDB also apparently needs some time
  setTimeout(() => {
    window.location.href = "/notes"
  }, 2000)

  document.title = "Log Out"
</script>

<Content size="lg" class="text-center">
  <div in:fly={{y: 20}}>Clearing your local database...</div>
</Content>
