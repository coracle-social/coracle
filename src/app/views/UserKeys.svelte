<script lang="ts">
  import type {Nip46Signer} from "@welshman/signer"
  import {session, signer} from "@welshman/app"
  import {nip19} from "nostr-tools"
  import Anchor from "src/partials/Anchor.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import {nsecEncode} from "src/util/nostr"

  const nip07 = "https://github.com/nostr-protocol/nips/blob/master/07.md"
  const keypairUrl = "https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/"
  const getBunkerUrl = () => ($signer as Nip46Signer).broker.getBunkerUrl()

  document.title = "Keys"
</script>

<FlexColumn xl>
  <FlexColumn>
    <div class="flex items-center gap-2">
      <i class="fa fa-key fa-lg" />
      <h2 class="staatliches text-2xl">Your keys</h2>
    </div>
    <p>
      Your account is identified across the network using a public/private <Anchor
        href={keypairUrl}
        external>keypair</Anchor
      >. This allows you to fully own your account, and move to another app if needed.
    </p>
    <div>
      <CopyValue label="Public Key" value={$session?.pubkey} encode={nip19.npubEncode} />
      <small class="text-neutral-100">
        Your public key identifies your account. You can share this with people trying to find you
        on nostr.
      </small>
    </div>
    {#if $session?.method === "nip01"}
      <div>
        <CopyValue
          isPassword
          label="Private Key"
          value={$session?.secret}
          encode={nsecEncode}
          hasEncryptPrompt />
        <small class="text-neutral-100">
          Your private key is used to prove your identity by cryptographically signing messages. <strong
            >Do not share this with anyone.</strong>
          Be careful about copying this into other apps - instead, consider using a <Anchor
            href={nip07}
            external>compatible browser extension</Anchor> to securely store your key.
        </small>
      </div>
    {/if}
    {#if $session?.method === "nip46"}
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
