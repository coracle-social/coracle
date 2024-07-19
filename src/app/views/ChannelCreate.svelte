<script lang="ts">
  import {uniq} from "ramda"
  import Field from "src/partials/Field.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonSelect from "src/app/shared/PersonSelect.svelte"
  import {router} from "src/app/util/router"
  import {pubkey, nip44, deriveEveryUserHasInboxRelays} from "src/engine"

  let value = []

  const submit = () => router.at("channels").of(pubkeys).push()

  $: pubkeys = uniq(value.concat($pubkey))
  $: everyUserHasInboxRelays = deriveEveryUserHasInboxRelays(pubkeys)
  $: hasLoginMethodThatDoesNotSupportNip44Error = pubkeys.length > 2 && !$nip44.isEnabled()
  $: hasGroupMemberWithoutInboxRelaysError = pubkeys.length > 2 && !$everyUserHasInboxRelays
  $: hasError = hasLoginMethodThatDoesNotSupportNip44Error || hasGroupMemberWithoutInboxRelaysError
</script>

<form on:submit|preventDefault={submit} class="flex justify-center py-12">
  <FlexColumn class="pb-56">
    <h2 class="staatliches text-center text-6xl">Start a conversation</h2>
    <Field label="Who do you want to talk to?">
      <PersonSelect multiple autofocus bind:value />
    </Field>
    <Anchor disabled={hasError} button tag="button" type="submit">Done</Anchor>
    {#if hasLoginMethodThatDoesNotSupportNip44Error}
      <p class="flex gap-2">
        <i class="fa fa-info-circle p-1" />
        You are using a login method that doesn't yet support group chats. Please consider upgrading
        your signer to access this feature.
      </p>
    {/if}
    {#if hasGroupMemberWithoutInboxRelaysError}
      <p class="flex gap-2">
        <i class="fa fa-info-circle p-1" />
        At least one of the group members does not have inbox relays setup. It is required for all members
        of a group chat to have inbox relays setup.
      </p>
    {/if}
  </FlexColumn>
</form>
