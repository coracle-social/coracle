<script lang="ts">
  import {getFeedArgs} from "@welshman/feeds"
  import DVMField from "src/app/shared/DVMField.svelte"

  export let feed
  export let onChange
</script>

<span class="staatliches text-lg">What options should be sent to the DVM?</span>
{#each getFeedArgs(feed) as dvmItem, i}
  <DVMField {dvmItem} onChange={it => onChange(feed.toSpliced(i + 1, 1, it))} />
{/each}
