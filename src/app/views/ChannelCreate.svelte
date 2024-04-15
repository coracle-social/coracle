<script lang="ts">
  import {pluck, uniq} from "ramda"
  import Field from "src/partials/Field.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonMultiSelect from "src/app/shared/PersonMultiSelect.svelte"
  import {router} from "src/app/util/router"
  import {pubkey, nip44} from "src/engine"

  let profiles = []

  const submit = () => router.at("channels").of(pubkeys).push()

  $: pubkeys = uniq(pluck("pubkey", profiles).concat($pubkey))
  $: hasError = pubkeys.length > 2 && !$nip44.isEnabled()
</script>

<form on:submit|preventDefault={submit} class="flex justify-center py-12">
  <FlexColumn class="pb-56">
    <h2 class="staatliches text-center text-6xl">Start a conversation</h2>
    <Field label="Who do you want to talk to?">
      <PersonMultiSelect autofocus bind:value={profiles} />
    </Field>
    <Anchor disabled={hasError} button tag="button" type="submit">Done</Anchor>
    {#if hasError}
      <p class="flex gap-2">
        <i class="fa fa-info-circle p-1" />
        You are using a login method that doesn't yet support group chats. Please consider upgrading
        your signer to access this feature.
      </p>
    {/if}
  </FlexColumn>
</form>
