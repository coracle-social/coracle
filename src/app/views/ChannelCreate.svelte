<script lang="ts">
  import {derived} from "svelte/store"
  import {_} from "svelte-i18n"
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
    <h2 class="staatliches text-center text-6xl">{$_("channelCreate.title")}</h2>
    <Field label={$_("channelCreate.whoToTalkTo")}>
      <PersonSelect multiple autofocus bind:value />
    </Field>
    <Button class="btn" disabled={nip44Disabled} type="submit">{$_("channelCreate.startChat")}</Button>
    {#if nip44Disabled}
      <p class="flex gap-2">
        <i class="fa fa-info-circle p-1" />
        {$_("channelCreate.groupChatWarning")}
      </p>
    {/if}
    {#if missingMessaging}
      <p class="flex gap-2">
        <i class="fa fa-info-circle p-1" />
        {displayList($pubkeysWithoutMessaging.map(displayProfileByPubkey))}
        {pluralize($pubkeysWithoutMessaging.length, $_("channelCreate.doesNotHave"), $_("channelCreate.doNotHave"))}
        {$_("channelCreate.missingRelaysWarning")}
      </p>
    {/if}
  </FlexColumn>
</form>
