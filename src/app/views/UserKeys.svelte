<script lang="ts">
  import {Nip46Broker} from "@welshman/signer"
  import type {Nip46BrokerParams} from "@welshman/signer"
  import * as nip19 from "nostr-tools/nip19"
  import Link from "src/partials/Link.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import {nsecEncode} from "src/util/nostr"
  import {session} from "src/engine/core"

  const nip07 = "https://github.com/nostr-protocol/nips/blob/master/07.md"
  const keypairUrl = "https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/"

  // App policies wrap the user's signer, so read the connection out of the stored session rather
  // than reaching through the wrapper for a Nip46Signer that may no longer be the outermost one.
  const getBunkerUrl = () =>
    new Nip46Broker($session!.session.data as Nip46BrokerParams).getBunkerUrl()

  const getSecret = () => ($session!.session.data as {secret: string}).secret

  document.title = "Keys"
</script>

<FlexColumn xl>
  <FlexColumn>
    <div class="flex items-center gap-2">
      <i class="fa fa-key fa-lg" />
      <h2 class="staatliches text-2xl">Your keys</h2>
    </div>
    <p>
      Your account is identified across the network using a public/private <Link
        external
        href={keypairUrl}
        class="underline">keypair</Link
      >. This allows you to fully own your account, and move to another app if needed.
    </p>
    <div>
      <CopyValue label="Public Key" value={$session?.pubkey} encode={nip19.npubEncode} />
      <small class="text-neutral-100">
        Your public key identifies your account. You can share this with people trying to find you
        on nostr.
      </small>
    </div>
    {#if $session?.session.method === "nip01"}
      <div>
        <CopyValue
          isPassword
          label="Private Key"
          value={getSecret()}
          encode={nsecEncode}
          hasEncryptPrompt />
        <small class="text-neutral-100">
          Your private key is used to prove your identity by cryptographically signing messages. <strong
            >Do not share this with anyone.</strong>
          Be careful about copying this into other apps - instead, consider using a <Link
            external
            href={nip07}
            class="underline">compatible browser extension</Link> to securely store your key.
        </small>
      </div>
    {/if}
    {#if $session?.session.method === "nip46"}
      <div>
        <CopyValue label="Bunker URL" value={getBunkerUrl()} />
        <small class="text-neutral-100">
          Your bunker url works like password, and can be used instead of your private key to log in
          to other apps. This is safer than sharing your private key, but you should still be
          careful to keep your bunker url private.
        </small>
      </div>
    {/if}
  </FlexColumn>
</FlexColumn>
