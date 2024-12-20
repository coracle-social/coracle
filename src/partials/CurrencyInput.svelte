<script lang="ts">
  import {prop} from "@welshman/lib"
  import {fuzzy} from "src/util/misc"
  import {currencyOptions} from "src/util/i18n"
  import SearchSelect from "src/partials/SearchSelect.svelte"

  export let value

  const getKey = prop("code")
  const termToItem = code => ({name: code, code})
  const search = fuzzy(currencyOptions, {keys: ["name", "code"], threshold: 0.4})
  const defaultCodes = ["BTC", "SAT", "USD", "GBP", "AUD", "CAD"]
  const defaultOptions = currencyOptions.filter(c => defaultCodes.includes(c.code))
</script>

<SearchSelect bind:value {getKey} {termToItem} {defaultOptions} {search}>
  <span slot="before">
    <i class="fa fa-right-left" />
  </span>
  <div slot="item" let:item>
    {item.name} ({item.code})
  </div>
</SearchSelect>
