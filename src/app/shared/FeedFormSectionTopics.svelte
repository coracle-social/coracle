<script lang="ts">
  import {identity} from "@welshman/lib"
  import {FeedType} from "@welshman/feeds"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {searchTopicNames} from "src/engine"

  export let feed
  export let onChange
</script>

<span class="staatliches text-lg">Which topics do you want to see?</span>
<SearchSelect
  multiple
  value={feed.slice(2)}
  search={$searchTopicNames}
  termToItem={identity}
  onChange={topics => onChange([FeedType.Tag, "#t", ...topics])}>
  <span slot="item" let:item>#{item}</span>
</SearchSelect>
