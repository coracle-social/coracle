<script lang="ts">
  import {ucFirst} from 'hurdak'
  import {omit, without, last} from "ramda"
  import {Scope} from '@coracle.social/feeds'
  import Field from "src/partials/Field.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import SelectButton from "src/partials/SelectButton.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {searchPubkeys, displayPubkey} from 'src/engine'

  export let filter
  export let onChange
  export let onRemove

  const scopeOptions = (Object.values(Scope) as string[]).concat(['custom'])

  const changeAuthors = authors => onChange(omit(['scopes'], {...filter, authors}))

  const changeScopes = scopes =>
    last(scopes) === 'custom'
      ? changeAuthors([])
      : onChange(omit(['authors'], {...filter, scopes: without(['custom'], scopes)}))

  $: scopes = filter.scopes || ['custom']
</script>

<Field>
  <span slot="label" class="flex gap-2 items-center cursor-pointer" on:click={onRemove}>
    <i class="fa fa-trash fa-sm" /> Authors
  </span>
  <SelectButton multiple onChange={changeScopes} value={scopes} options={scopeOptions} displayOption={ucFirst} />
  {#if !filter.scopes}
    <SearchSelect multiple search={$searchPubkeys} value={filter.authors || []} onChange={changeAuthors}>
      <div slot="item" let:item let:context>
        {#if context === "value"}
          {displayPubkey(item)}
        {:else}
          <PersonBadge inert pubkey={item} />
        {/if}
      </div>
    </SearchSelect>
  {/if}
</Field>
