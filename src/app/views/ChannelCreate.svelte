<script lang="ts">
  import {prop, pluck} from "ramda"
  import {navigate} from "svelte-routing"
  import Content from "src/partials/Content.svelte"
  import MultiSelect from "src/partials/MultiSelect.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {Nip24, Directory} from "src/app/engine"

  let profiles = []

  const {searchProfiles} = Directory

  const submit = () => {
    const channelId = Nip24.getChannelId(pluck("pubkey", profiles))

    navigate(`/channels/${channelId}`)
  }
</script>

<form on:submit|preventDefault={submit} class="flex justify-center py-12">
  <Content>
    <h2 class="staatliches text-center text-6xl">Start a conversation</h2>
    <div class="flex w-full flex-col gap-8 pb-56">
      <div class="flex flex-col gap-1">
        <strong>Group members</strong>
        <MultiSelect search={$searchProfiles} bind:value={profiles} getKey={prop("pubkey")}>
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
        <p class="text-sm text-gray-1">Who do you want to invite?</p>
      </div>
      <Anchor tag="button" theme="button" type="submit" class="text-center">Done</Anchor>
    </div>
  </Content>
</form>
