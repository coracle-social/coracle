<script lang="ts">
  import Feed from 'src/app/shared/Feed.svelte'
  import type {DynamicFilter} from 'src/engine'
  import {env, pubkey, follows, getPubkeysWithDefaults} from 'src/engine'

  const filter: DynamicFilter = {kinds: [30402]}

  if ($env.FORCE_GROUP) {
    filter['#a'] = [$env.FORCE_GROUP]
  } else {
    filter.authors = getPubkeysWithDefaults($follows).concat($pubkey)
  }
</script>

<Feed hideControls={$env.FORCE_GROUP} {filter} />
