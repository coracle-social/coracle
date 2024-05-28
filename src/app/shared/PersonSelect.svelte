<script lang="ts">
  import {uniq} from "@welshman/lib"
  import {parseAnything} from "src/util/nostr"
  import Anchor from "src/partials/Anchor.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {router} from "src/app/util/router"
  import {profileSearch, createPeopleLoader, displayPersonByPubkey} from "src/engine"

  export let value
  export let multiple = false
  export let autofocus = false
  export let onChange = null

  let input

  const {loading, load} = createPeopleLoader()

  const search = term => {
    if (term.length > 2) {
      load(term)
    }

    parseAnything(term).then(result => {
      if (result?.type === "npub") {
        value = uniq(value.concat(result.data))
        input.clearTerm()
      }

      if (result?.type === "nprofile") {
        value = uniq(value.concat(result.data.pubkey))
        input.clearTerm()
      }
    })

    return $profileSearch.search(term)
  }
</script>

<SearchSelect
  {search}
  {onChange}
  {multiple}
  {autofocus}
  bind:value
  bind:this={input}
  loading={$loading}>
  <div slot="item" let:item let:context>
    <div class="-my-1">
      {#if context === "value"}
        <Anchor modal href={router.at("people").of(item).toString()}>
          {displayPersonByPubkey(item)}
        </Anchor>
      {:else}
        <PersonBadge inert pubkey={item} />
      {/if}
    </div>
  </div>
</SearchSelect>
