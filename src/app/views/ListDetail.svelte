<script lang="ts">
  import {noop, uniq} from "@welshman/lib"
  import {hexTags, tagValues} from "@welshman/util"
  import Link from "src/partials/Link.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import ListCard from "src/app/shared/ListCard.svelte"
  import PersonList from "src/app/shared/PersonList.svelte"
  import {router} from "src/app/util"
  import {readUserList} from "src/domain"
  import {deriveEvent} from "src/engine"
  import {pubkey} from "src/engine/core"

  export let address

  const event = deriveEvent(address)

  let pubkeys = []

  $: if ($event) {
    readUserList($event).then(list => {
      pubkeys = uniq(tagValues(hexTags("p"), list.tags))
    }, noop)
  }
</script>

{#if $event}
  <FlexColumn>
    <ListCard {address}>
      <div slot="controls" class="flex gap-2">
        {#if $event.pubkey === $pubkey}
          <Link modal href={router.at("lists").of(address).at("edit").toString()}>
            <i class="fa fa-edit" /> Edit
          </Link>
        {/if}
      </div>
    </ListCard>
    {#if pubkeys.length > 0}
      <h2 class="staatliches text-xl">People</h2>
      <PersonList {pubkeys} />
    {/if}
  </FlexColumn>
{:else}
  <p class="text-center">Sorry, we weren't able to find that list.</p>
{/if}
