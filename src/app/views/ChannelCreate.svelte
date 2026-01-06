<script lang="ts">
  import {derived} from "svelte/store"
  import {displayList, uniq} from "@welshman/lib"
  import {isShareableRelayUrl, getRelaysFromList} from "@welshman/util"
  import {pubkey, displayProfileByPubkey, messagingRelayListsByPubkey} from "@welshman/app"
  import Field from "src/partials/Field.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Button from "src/partials/Button.svelte"
  import PersonSelect from "src/app/shared/PersonSelect.svelte"
  import {router} from "src/app/util/router"
  import {hasNip44} from "src/engine"
  import {pluralize} from "src/util/misc"

  let value = []

  const submit = () => router.at("channels").of(pubkeys).push()

  $: pubkeys = uniq(value.concat($pubkey))
  $: pubkeysWithoutMessaging = derived(messagingRelayListsByPubkey, $messagingRelayListsByPubkey =>
    pubkeys.filter(
      pubkey =>
        !getRelaysFromList($messagingRelayListsByPubkey.get(pubkey)).some(isShareableRelayUrl),
    ),
  )
  $: nip44Disabled = pubkeys.length > 2 && !$hasNip44
  $: missingMessaging = pubkeys.length > 2 && $pubkeysWithoutMessaging.length > 0
</script>

<form on:submit|preventDefault={submit} class="flex justify-center py-12">
  <FlexColumn class="pb-56">
    <h2 class="staatliches text-center text-6xl">Start a conversation</h2>
    <Field label="Who do you want to talk to?">
      <PersonSelect multiple autofocus bind:value />
    </Field>
    <Button class="btn" disabled={nip44Disabled} type="submit">Start Chat</Button>
    {#if nip44Disabled}
      <p class="flex gap-2">
        <i class="fa fa-info-circle p-1" />
        You are using a login method that doesn't yet support group chats. Please consider upgrading
        your signer to access this feature.
      </p>
    {/if}
    {#if missingMessaging}
      <p class="flex gap-2">
        <i class="fa fa-info-circle p-1" />
        {displayList($pubkeysWithoutMessaging.map(displayProfileByPubkey))}
        {pluralize($pubkeysWithoutMessaging.length, "does not have", "do not have")}
        messaging relays, which means they likely either don't want to receive DMs, or are using a client
        that does not support nostr group chats.
      </p>
    {/if}
  </FlexColumn>
</form>
