<script lang="ts">
  import {pluck} from "ramda"
  import {navigate} from "svelte-routing"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonMultiSelect from "src/app/shared/PersonMultiSelect.svelte"
  import {getNip24ChannelId} from "src/engine"

  let profiles = []

  const submit = () => navigate(`/channels/${getNip24ChannelId(pluck("pubkey", profiles))}`)
</script>

<form on:submit|preventDefault={submit} class="flex justify-center py-12">
  <Content>
    <h2 class="staatliches text-center text-6xl">Start a conversation</h2>
    <div class="flex w-full flex-col gap-8 pb-56">
      <div class="flex flex-col gap-1">
        <strong>Group members</strong>
        <PersonMultiSelect bind:value={profiles} />
        <p class="text-sm text-gray-1">Who do you want to invite?</p>
      </div>
      <Anchor tag="button" theme="button" type="submit" class="text-center">Done</Anchor>
    </div>
  </Content>
</form>
