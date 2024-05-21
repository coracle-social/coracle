<script lang="ts">
  import {toTitle} from "hurdak"
  import {without} from "ramda"
  import {identity, uniq} from "@welshman/lib"
  import {Scope, isScopeFeed, isAuthorFeed, makeAuthorFeed, makeScopeFeed} from "@welshman/feeds"
  import {parseAnythingSync} from "src/util/nostr"
  import Anchor from "src/partials/Anchor.svelte"
  import SelectButton from "src/partials/SelectButton.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import PersonNameOnly from "src/app/shared/PersonNameOnly.svelte"
  import {searchPubkeys} from "src/engine"
  import {router} from "src/app/util/router"

  export let feed
  export let onChange

  const scopeOptions = (Object.values(Scope) as string[]).concat("custom")

  const parsePubkey = () => {
    const result = parseAnythingSync(searchSelect.getTerm())

    if (result?.type === "npub") {
      searchSelect.clear()
      onChange(uniq(feed.concat(result.data)))
    }

    if (result?.type === "nprofile") {
      searchSelect.clear()
      onChange(uniq(feed.concat(result.data.pubkey)))
    }
  }

  const onScopeChange = scopes => {
    if (isScopeFeed(feed) && scopes.includes("custom")) {
      onChange(makeAuthorFeed())
    } else {
      onChange(makeScopeFeed(...(without(["custom"], scopes) as Scope[])))
    }
  }

  let searchSelect

  $: scopes = isScopeFeed(feed) ? feed.slice(1) : ["custom"]
</script>

<span>Which authors would you like to see?</span>
<SelectButton
  multiple
  value={scopes}
  displayOption={toTitle}
  options={scopeOptions}
  onChange={onScopeChange} />
{#if isAuthorFeed(feed)}
  <SearchSelect
    multiple
    bind:this={searchSelect}
    value={feed.slice(1)}
    search={$searchPubkeys}
    onInput={parsePubkey}
    onChange={pubkeys => onChange(makeAuthorFeed(...uniq(pubkeys)))}>
    <span slot="item" let:item let:context>
      {#if context === "value"}
        <Anchor modal href={router.at("people").of(item).toString()}>
          <PersonNameOnly pubkey={item} />
        </Anchor>
      {:else}
        <PersonBadge inert pubkey={item} />
      {/if}
    </span>
  </SearchSelect>
{/if}
