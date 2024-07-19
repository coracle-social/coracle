<script lang="ts">
  import {uniq} from "@welshman/lib"
  import {displayList, pluralize} from "hurdak"
  import Field from "src/partials/Field.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonSelect from "src/app/shared/PersonSelect.svelte"
  import {router} from "src/app/util/router"
  import {pubkey, nip44, derivePubkeysWithoutInbox, displayProfileByPubkey} from "src/engine"

  let value = []

  const submit = () => router.at("channels").of(pubkeys).push()

  $: pubkeys = uniq(value.concat($pubkey))
  $: pubkeysWithoutInbox = derivePubkeysWithoutInbox(pubkeys)
  $: nip44Disabled = pubkeys.length > 2 && !$nip44.isEnabled()
  $: missingInbox = pubkeys.length > 2 && $pubkeysWithoutInbox.length > 0
  $: hasError = nip44Disabled || missingInbox
</script>

<form on:submit|preventDefault={submit} class="flex justify-center py-12">
  <FlexColumn class="pb-56">
    <h2 class="staatliches text-center text-6xl">Start a conversation</h2>
    <Field label="Who do you want to talk to?">
      <PersonSelect multiple autofocus bind:value />
    </Field>
    <Anchor disabled={hasError} button tag="button" type="submit">Done</Anchor>
    {#if nip44Disabled}
      <p class="flex gap-2">
        <i class="fa fa-info-circle p-1" />
        You are using a login method that doesn't yet support group chats. Please consider upgrading
        your signer to access this feature.
      </p>
    {/if}
    {#if missingInbox}
      <p class="flex gap-2">
        <i class="fa fa-info-circle p-1" />
        {displayList($pubkeysWithoutInbox.map(displayProfileByPubkey))}
        {pluralize($pubkeysWithoutInbox.length, "does not have", "do not have")}
        inbox relays, which means they likely either don't want to receive DMs, or are using a client
        that does not support nostr group chats.
      </p>
    {/if}
  </FlexColumn>
</form>
