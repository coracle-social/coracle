<script lang="ts">
  import {prop} from "ramda"
  import {Scope} from '@coracle.social/feeds'
  import {fuzzy} from 'src/util/misc'
  import Field from "src/partials/Field.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {searchPubkeys, displayPubkey} from 'src/engine'

  export let filter
  export let onChange
  export let onRemove

  const change = pubkeys => onChange({...filter, '#p': pubkeys})
</script>

<Field>
  <span slot="label" class="flex gap-2 items-center cursor-pointer" on:click={onRemove}>
    <i class="fa fa-trash fa-sm" /> Mentions
  </span>
  <SearchSelect multiple search={$searchPubkeys} value={filter['#p'] || []} onChange={change}>
    <div slot="item" let:item let:context>
      {#if context === "value"}
        {displayPubkey(item)}
      {:else}
        <PersonBadge inert pubkey={item} />
      {/if}
    </div>
  </SearchSelect>
</Field>
