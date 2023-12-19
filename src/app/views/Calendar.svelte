<script lang="ts">
  import Calendar from "src/app/shared/Calendar.svelte"
  import type {DynamicFilter} from 'src/engine'
  import {env, pubkey, follows, compileFilters, getPubkeysWithDefaults, getRelaysFromFilters} from 'src/engine'

  const filter: DynamicFilter = {kinds: [31923]}

  if ($env.FORCE_GROUP) {
    filter['#a'] = [$env.FORCE_GROUP]
  } else if ($pubkey) {
    filter.authors = getPubkeysWithDefaults($follows).concat($pubkey)
  }

  const filters = compileFilters([filter])
  const relays = getRelaysFromFilters(filters)
</script>

<Calendar {filters} {relays} />
