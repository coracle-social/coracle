<script lang="ts">
  import {prop, uniqBy} from "ramda"
  import {parseAnything} from "src/util/nostr"
  import Anchor from "src/partials/Anchor.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {router} from "src/app/util/router"
  import {searchPeople, displayPubkey, derivePerson} from "src/engine"

  export let value
  export let autofocus = false

  let input

  const showPerson = person => router.at("people").of(person.pubkey).open()

  const search = term => {
    parseAnything(term).then(result => {
      if (result?.type === 'npub') {
        value = uniqBy(prop('pubkey'), value.concat(derivePerson(result.data).get()))
        input.clearTerm()
      }
    })

    return $searchPeople(term)
  }
</script>

<SearchSelect multiple {autofocus} bind:this={input} bind:value {search} getKey={prop("pubkey")}>
  <i slot="before" class="fa fa-people-pulling" />
  <div slot="item" let:item let:context>
    <div class="-my-1">
      {#if context === "value"}
        <Anchor on:click={() => showPerson(item)}>
          {displayPubkey(item.pubkey)}
        </Anchor>
      {:else}
        <PersonBadge inert pubkey={item.pubkey} />
      {/if}
    </div>
  </div>
</SearchSelect>
