<script lang="ts">
  import {toTitle} from "hurdak"
  import {without} from "ramda"
  import {FeedType, Scope, isScopeFeed, isAuthorFeed} from "@welshman/feeds"
  import Field from "src/partials/Field.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import SelectButton from "src/partials/SelectButton.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {searchPubkeys, displayPubkey} from "src/engine"
  import {router} from "src/app/util/router"

  export let feed
  export let onChange

  const scopeOptions = (Object.values(Scope) as string[]).concat("custom")

  const onScopeChange = scopes => {
    if (isScopeFeed(feed) && scopes.includes("custom")) {
      onChange([FeedType.Author])
    } else {
      onChange([FeedType.Scope, ...without(["custom"], scopes)])
    }
  }

  $: scopes = isScopeFeed(feed) ? feed.slice(1) : ["custom"]
</script>

<Field label="Which authors would you like to see?">
  <SelectButton
    multiple
    value={scopes}
    displayOption={toTitle}
    options={scopeOptions}
    onChange={onScopeChange} />
  {#if isAuthorFeed(feed)}
    <SearchSelect
      multiple
      value={feed.slice(1)}
      search={$searchPubkeys}
      onChange={pubkeys => onChange([FeedType.Author, ...pubkeys])}>
      <span slot="item" let:item let:context>
        {#if context === "value"}
          <Anchor modal href={router.at("people").of(item).toString()}>
            {displayPubkey(item)}
          </Anchor>
        {:else}
          <PersonBadge inert pubkey={item} />
        {/if}
      </span>
    </SearchSelect>
  {/if}
</Field>
