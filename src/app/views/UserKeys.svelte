<script lang="ts">
  import {_} from "svelte-i18n"
  import type {Nip46Signer} from "@welshman/signer"
  import {session, signer} from "@welshman/app"
  import * as nip19 from "nostr-tools/nip19"
  import Link from "src/partials/Link.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import {nsecEncode} from "src/util/nostr"

  const nip07 = "https://github.com/nostr-protocol/nips/blob/master/07.md"
  const keypairUrl = "https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/"
  const getBunkerUrl = () => ($signer.signer as Nip46Signer).broker.getBunkerUrl()

  document.title = $_("keys.title")
</script>

<FlexColumn xl>
  <FlexColumn>
    <div class="flex items-center gap-2">
      <i class="fa fa-key fa-lg" />
      <h2 class="staatliches text-2xl">{$_("keys.heading")}</h2>
    </div>
    <p>
      {$_("keys.description")}
    </p>
    <div>
      <CopyValue label={$_("keys.publicKey")} value={$session?.pubkey} encode={nip19.npubEncode} />
      <small class="text-neutral-100">
        {$_("keys.publicKeyInfo")}
      </small>
    </div>
    {#if $session?.method === "nip01"}
      <div>
        <CopyValue
          isPassword
          label={$_("keys.privateKey")}
          value={$session?.secret}
          encode={nsecEncode}
          hasEncryptPrompt />
        <small class="text-neutral-100">
          {$_("keys.privateKeyInfo")}
        </small>
      </div>
    {/if}
    {#if $session?.method === "nip46"}
      <div>
        <CopyValue label={$_("keys.bunkerUrl")} value={getBunkerUrl()} />
        <small class="text-neutral-100">
          {$_("keys.bunkerUrlInfo")}
        </small>
      </div>
    {/if}
  </FlexColumn>
</FlexColumn>
