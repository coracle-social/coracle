<script lang="ts">
  import {append, uniq} from '@welshman/lib'
  import SelectButton from 'src/partials/SelectButton.svelte'
  import SearchSelect from 'src/partials/SearchSelect.svelte'
  import {session, groupMetaSearch, displayGroupByAddress} from "src/engine"

  export let ctrl

  const onChange = groups => {
    $ctrl.draft.groups = groups
  }

  const addGroup = group => {
    if (group) {
      $ctrl.draft.groups = append(group, $ctrl.draft.groups)
      groupInput.clear()
    }
  }

  let groupInput

  $: groupOptions = uniq([...groupOptions || [], ...$ctrl.draft.groups, ...Object.keys($session.groups)])
</script>

<p>Select which groups to publish to</p>
<SelectButton multiple value={$ctrl.draft.groups} onChange={onChange} options={groupOptions}>
  <span slot="item" let:option>{displayGroupByAddress(option)}</span>
</SelectButton>
<SearchSelect
  onChange={addGroup}
  bind:this={groupInput}
  search={$groupMetaSearch.searchValues}
  placeholder="Search groups">
  <span slot="item" let:item>{$groupMetaSearch.displayValue(item)}</span>
</SearchSelect>
