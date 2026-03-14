<script lang="ts">
  import {_} from "svelte-i18n"
  import * as nip19 from "nostr-tools/nip19"
  import {Router} from "@welshman/router"
  import {parseJson} from "@welshman/lib"
  import {deriveProfile, deriveHandleForPubkey, displayHandle} from "@welshman/app"
  import {copyToClipboard} from "src/util/html"
  import {showInfo} from "src/partials/Toast.svelte"
  import Field from "src/partials/Field.svelte"
  import Button from "src/partials/Button.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"

  export let pubkey

  const profile = deriveProfile(pubkey)
  const handle = deriveHandleForPubkey(pubkey)
  const relays = Router.get().FromPubkey(pubkey).getUrls()

  const copyJson = () => {
    copyToClipboard(json)
    showInfo(`Profile JSON copied to clipboard!`)
  }

  $: json = JSON.stringify(parseJson($profile?.event?.content), null, 2)
  $: lightningAddress = $profile?.lud16 || $profile?.lud06
</script>

<h1 class="staatliches text-2xl">{$_("personInfo.details")}</h1>
<CopyValue label={$_("personInfo.link")} value={nip19.nprofileEncode({pubkey, relays})} />
<CopyValue label={$_("personInfo.publicKey")} encode={nip19.npubEncode} value={pubkey} />
{#if $handle}
  {@const display = displayHandle($handle)}
  <CopyValue label={$_("personInfo.nostrAddress")} value={display} />
  <strong>{$_("personInfo.nostrAddressRelays")}</strong>
  {#each $handle.relays || [] as url}
    <RelayCard {url} />
  {:else}
    <p class="flex gap-2 items-center">
      <i class="fa fa-info-circle" />
      {$_("personInfo.noRelaysAdvertised", {values: {address: display}})}
    </p>
  {/each}
{:else}
  <p>
    <i class="fa-solid fa-info-circle" />
    {$_("personInfo.noNostrAddress")}
  </p>
{/if}
{#if lightningAddress}
  <CopyValue label={$_("personInfo.lightningAddress")} value={lightningAddress} />
{:else}
  <p>
    <i class="fa-solid fa-info-circle" />
    {$_("personInfo.noLightningAddress")}
  </p>
{/if}
{#if $profile}
  <Field>
    <p slot="label">{$_("personInfo.profileJson")}</p>
    <div class="relative rounded bg-tinted-700 p-1">
      <pre class="overflow-auto text-xs"><code>{json}</code></pre>
      <Button class="absolute right-1 top-1" on:click={copyJson}>
        <i class="fa fa-copy m-2" />
      </Button>
    </div>
  </Field>
{/if}
