<script lang="ts">
  import {getFeedArgs} from "@welshman/feeds"
  import Field from "src/partials/Field.svelte"
  import DVMField from "src/app/shared/DVMField.svelte"

  export let feed
  export let onChange
</script>

<Field label="What options should be sent to the DVM?">
  {#each getFeedArgs(feed) as dvmItem, i}
    <DVMField {dvmItem} onChange={it => onChange(feed.toSpliced(i + 1, 1, it))} />
  {/each}
</Field>
