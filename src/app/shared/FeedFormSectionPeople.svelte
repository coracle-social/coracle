<script lang="ts">
  import {without} from "@welshman/lib"
  import {Scope, isScopeFeed, isAuthorFeed, makeAuthorFeed, makeScopeFeed} from "@welshman/feeds"
  import SelectButton from "src/partials/SelectButton.svelte"
  import PersonSelect from "src/app/shared/PersonSelect.svelte"
  import {toTitle} from "src/util/misc"

  export let feed
  export let onChange

  const scopeOptions = (Object.values(Scope) as string[]).concat("custom")

  const onScopeChange = scopes => {
    if (isScopeFeed(feed) && scopes.includes("custom")) {
      onChange(makeAuthorFeed())
    } else {
      onChange(makeScopeFeed(...without<Scope>(["custom" as any], scopes)))
    }
  }

  const onPersonChange = (pubkeys: string[]) => onChange(makeAuthorFeed(...pubkeys))

  $: scopes = isScopeFeed(feed) ? feed.slice(1) : ["custom"]
</script>

<span class="staatliches text-lg">Which authors would you like to see?</span>
<SelectButton
  multiple
  value={scopes}
  displayOption={toTitle}
  options={scopeOptions}
  onChange={onScopeChange} />
{#if isAuthorFeed(feed)}
  <PersonSelect multiple value={feed.slice(1)} onChange={onPersonChange} />
{/if}
