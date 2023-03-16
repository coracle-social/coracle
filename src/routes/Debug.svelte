<script lang="ts">
  import {flatten} from "ramda"
  import {fly} from "svelte/transition"
  import {logs} from "src/util/logger.js"
  import {formatTimestamp} from "src/util/misc"
  import Content from "src/partials/Content.svelte"

  document.title = "Debug"
</script>

<Content>
  {#each flatten($logs) as { created_at, message }}
    <div in:fly={{y: 20}} class="flex flex-col gap-2 text-sm">
      <div class="text-gray-1 underline">
        {formatTimestamp(created_at / 1000)}
      </div>
      <pre>{message.map(m => JSON.stringify(m, null, 2)).join(" ")}</pre>
    </div>
  {/each}
</Content>
