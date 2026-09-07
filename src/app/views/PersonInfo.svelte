<script lang="ts">
  import * as nip19 from "nostr-tools/nip19"
  import {parseJson} from "@welshman/lib"
  import {displayHandle} from "@welshman/util"
  import {Handles, Profiles} from "@welshman/app"
  import {fromApp, getWriteRelays} from "src/engine/core"
  import {copyToClipboard} from "src/util/html"
  import {showInfo} from "src/partials/Toast.svelte"
  import Field from "src/partials/Field.svelte"
  import Button from "src/partials/Button.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"

  export let pubkey

  const profile = fromApp($app => $app.use(Profiles).one(pubkey))
  const handle = fromApp($app => $app.use(Handles).forPubkey(pubkey).$)
  // Router.FromPubkey was this pubkey's write relays; full relay selection is asynchronous now,
  // and this is an nprofile that has to be encoded in one pass.
  const relays = getWriteRelays(pubkey)

  const copyJson = () => {
    copyToClipboard(json)
    showInfo(`Profile JSON copied to clipboard!`)
  }

  $: json = JSON.stringify(parseJson($profile?.event.content), null, 2)
  $: lightningAddress = $profile?.values.lud16 || $profile?.values.lud06
</script>

<h1 class="staatliches text-2xl">Details</h1>
<CopyValue label="Link" value={nip19.nprofileEncode({pubkey, relays})} />
<CopyValue label="Public Key" encode={nip19.npubEncode} value={pubkey} />
{#if $handle}
  {@const display = displayHandle($handle)}
  <CopyValue label="Nostr Address" value={display} />
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
