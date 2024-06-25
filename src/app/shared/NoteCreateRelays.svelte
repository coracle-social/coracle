<script lang="ts">
  import {append, uniq} from '@welshman/lib'
  import SelectButton from 'src/partials/SelectButton.svelte'
  import SearchSelect from 'src/partials/SearchSelect.svelte'
  import {displayRelayUrl, normalizeRelayUrl} from 'src/domain'
  import {userRelayPolicies, relaySearch} from 'src/engine'

  export let ctrl

  const onChange = relays => {
    $ctrl.draft.relays = relays
  }

  const addRelay = relay => {
    if (relay) {
      $ctrl.draft.relays = append(relay, $ctrl.draft.relays)
      relayInput.clear()
    }
  }

  let relayInput

  $: relayOptions = uniq([...relayOptions || [], ...$ctrl.draft.relays, ...$userRelayPolicies.map(p => p.url)])
</script>

<p>Select which relays to publish to</p>
<SelectButton multiple value={$ctrl.draft.relays} onChange={onChange} options={relayOptions}>
  <span slot="item" let:option>{displayRelayUrl(option)}</span>
</SelectButton>
<SearchSelect
  onChange={addRelay}
  bind:this={relayInput}
  termToItem={normalizeRelayUrl}
  search={$relaySearch.searchValues}
  placeholder="Add another relay">
  <span slot="item" let:item>{$relaySearch.displayValue(item)}</span>
</SearchSelect>
