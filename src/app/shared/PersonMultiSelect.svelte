<script lang="ts">
  import {prop} from "ramda"
  import MultiSelect from "src/partials/MultiSelect.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {Directory} from "src/app/engine"

  export let value

  const {searchProfiles} = Directory
</script>

<MultiSelect bind:value search={$searchProfiles} getKey={prop("pubkey")}>
  <i slot="before" class="fa fa-people-pulling" />
  <div slot="item" let:item let:context>
    <div class="-my-1">
      {#if context === "value"}
        {Directory.displayPubkey(item.pubkey)}
      {:else}
        <PersonBadge inert pubkey={item.pubkey} />
      {/if}
    </div>
  </div>
</MultiSelect>
