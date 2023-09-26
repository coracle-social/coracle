<script lang="ts">
  import {prop} from "ramda"
  import Anchor from "src/partials/Anchor.svelte"
  import {modal} from "src/partials/state"
  import MultiSelect from "src/partials/MultiSelect.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {searchPeople, displayPubkey} from "src/engine"

  export let value

  const showPerson = person => {
    modal.push({type: "person/detail", pubkey: person.pubkey})
  }
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
