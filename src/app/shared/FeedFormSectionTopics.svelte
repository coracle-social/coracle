<script lang="ts">
  import {identity} from "@welshman/lib"
  import {FeedType} from "@welshman/feeds"
  import {Topics} from "@welshman/app"
  import {fromApp} from "src/engine/core"
  import SearchSelect from "src/partials/SearchSelect.svelte"

  export let feed
  export let onChange

  const topicSearch = fromApp($app => $app.use(Topics).topicSearch)
</script>

<span class="staatliches text-lg">Which topics do you want to see?</span>
<SearchSelect
  multiple
  value={feed.slice(2)}
  search={$topicSearch.searchValues}
  termToItem={identity}
  onChange={topics => onChange([FeedType.Tag, "#t", ...topics])}>
  <span slot="item" let:item>#{item}</span>
</SearchSelect>
