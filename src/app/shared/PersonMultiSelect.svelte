<script lang="ts">
  import {prop} from "ramda"
  import Anchor from "src/partials/Anchor.svelte"
  import MultiSelect from "src/partials/MultiSelect.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {router} from "src/app/router"
  import {searchPeople, displayPubkey} from "src/engine"

  export let value

  const showPerson = person => router.at("people").of(person.pubkey).open()
</script>

<MultiSelect bind:value search={$searchPeople} getKey={prop("pubkey")}>
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
</MultiSelect>
