<script lang="ts">
  import {FeedType} from '@welshman/feeds'
  import Field from 'src/partials/Field.svelte'
  import SearchSelect from 'src/partials/SearchSelect.svelte'
  import {searchTopicNames} from 'src/engine'

  export let feed
  export let onChange
</script>

<Field label="Which topics do you want to see?">
  <SearchSelect
    multiple
    value={feed.slice(2)}
    search={$searchTopicNames}
    onChange={topics => onChange([FeedType.Tag, "#t", ...topics])}>
    <span slot="item" let:item>#{item}</span>
  </SearchSelect>
</Field>
