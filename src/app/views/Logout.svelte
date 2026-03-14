<script lang="ts">
  import {_} from "svelte-i18n"
  import {fly} from "src/util/transition"
  import {clearStorage} from "src/engine/storage"
  import Content from "src/partials/Content.svelte"

  clearStorage()
  localStorage.clear()

  // Do a hard refresh so everything gets totally cleared. Give them a moment to see the state
  // transition. IndexedDB also apparently needs some time
  setTimeout(() => {
    window.location.href = "/notes"
  }, 2000)

  document.title = $_("logout.logOut")
</script>

<Content size="lg" class="text-center">
  <div in:fly={{y: 20}}>{$_("logout.clearingDatabase")}</div>
</Content>
