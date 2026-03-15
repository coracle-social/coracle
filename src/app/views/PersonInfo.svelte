<script lang="ts">
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
  import {isNamecoinIdentifier, verifyNamecoinWithSettings} from "src/util/namecoin"

  export let pubkey

  const profile = deriveProfile(pubkey)
  const handle = deriveHandleForPubkey(pubkey)
  const relays = Router.get().FromPubkey(pubkey).getUrls()

  const copyJson = () => {
    copyToClipboard(json)
    showInfo(`Profile JSON copied to clipboard!`)
  }

  let namecoinStatus: "idle" | "loading" | "verified" | "failed" = "idle"

  $: json = JSON.stringify(parseJson($profile?.event?.content), null, 2)
  $: lightningAddress = $profile?.lud16 || $profile?.lud06
  $: nip05Value = $profile?.nip05 || ""
  $: isNmc = isNamecoinIdentifier(nip05Value)

  // Trigger Namecoin verification when a .bit NIP-05 is detected
  $: if (isNmc && pubkey && namecoinStatus === "idle") {
    namecoinStatus = "loading"
    verifyNamecoinWithSettings(nip05Value, pubkey)
      .then(ok => {
        namecoinStatus = ok ? "verified" : "failed"
      })
      .catch(() => {
        namecoinStatus = "failed"
      })
  }
</script>

<h1 class="staatliches text-2xl">Details</h1>
<CopyValue label="Link" value={nip19.nprofileEncode({pubkey, relays})} />
<CopyValue label="Public Key" encode={nip19.npubEncode} value={pubkey} />
{#if $handle}
  {@const display = displayHandle($handle)}
  <CopyValue label="Nostr Address" value={display} />
  {#if isNmc}
    <div class="flex items-center gap-2 text-sm">
      <strong>Namecoin Verification</strong>
      {#if namecoinStatus === "loading"}
        <span class="text-neutral-400"><i class="fa fa-spinner fa-spin" /> Checking blockchain…</span>
      {:else if namecoinStatus === "verified"}
        <span class="text-green-400"><i class="fa fa-check-circle" /> Verified on Namecoin blockchain</span>
      {:else if namecoinStatus === "failed"}
        <span class="text-red-400"><i class="fa fa-times-circle" /> Could not verify on blockchain</span>
      {/if}
    </div>
  {/if}
  <strong>Nostr Address Relays</strong>
  {#each $handle.relays || [] as url}
    <RelayCard {url} />
  {:else}
    <p class="flex gap-2 items-center">
      <i class="fa fa-info-circle" />
      No relays are advertised at {display}.
    </p>
  {/each}
{:else}
  <p>
    <i class="fa-solid fa-info-circle" />
    No Nostr address found.
  </p>
{/if}
{#if lightningAddress}
  <CopyValue label="Lightning Address" value={lightningAddress} />
{:else}
  <p>
    <i class="fa-solid fa-info-circle" />
    No lightning address found.
  </p>
{/if}
{#if $profile}
  <Field>
    <p slot="label">Profile JSON</p>
    <div class="relative rounded bg-tinted-700 p-1">
      <pre class="overflow-auto text-xs"><code>{json}</code></pre>
      <Button class="absolute right-1 top-1" on:click={copyJson}>
        <i class="fa fa-copy m-2" />
      </Button>
    </div>
  </Field>
{/if}
