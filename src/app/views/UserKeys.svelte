<script lang="ts">
  import {relaySearch, session} from "@welshman/app"
  import {ctx} from "@welshman/lib"
  import {getPubkey, Nip01Signer, Nip59} from "@welshman/signer"
  import type {SignedEvent} from "@welshman/util"
  import {WRAP} from "@welshman/util"
  import {nip19} from "nostr-tools"
  import {subscribe} from "src/engine"
  import Anchor from "src/partials/Anchor.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import Field from "src/partials/Field.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Input from "src/partials/Input.svelte"
  import Modal from "src/partials/Modal.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {showInfo, showWarning} from "src/partials/Toast.svelte"
  import {isKeyValid, nsecEncode, toHex} from "src/util/nostr"

  const nip07 = "https://github.com/nostr-protocol/nips/blob/master/07.md"
  const keypairUrl = "https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/"

  let nsec = null
  let relays = []
  let importing = false

  const startImport = () => {
    nsec = ""
  }

  const cancelImport = () => {
    nsec = null
  }

  const finishImport = async () => {
    importing = true

    const privkey = nsec.startsWith("nsec") ? toHex(nsec) : nsec

    if (!isKeyValid(privkey)) {
      showWarning("Sorry, but that's an invalid private key.")
      importing = false
      return
    }

    const pubkey = getPubkey(privkey)

    const helper = Nip59.fromSigner(new Nip01Signer(privkey))

    let found

    // Look for group definition events by this pubkey so we can associate the key with the group
    const sub = subscribe({
      closeOnEose: true,
      relays: ctx.app.router.User().getUrls().concat(relays),
      filters: [{kinds: [WRAP], "#p": [pubkey], limit: 500}],
      onEvent: async event => {
        if (event.kind === WRAP) {
          event = await helper.unwrap(event as SignedEvent)
        }

        if (event?.kind !== 35834 || event?.pubkey !== pubkey) {
          return
        }

        found = event
        sub.close()
      },
      onComplete: () => {
        importing = false

        if (found) {
          nsec = null
          showInfo("Successfully imported admin key!")
        } else {
          showWarning("Sorry, we weren't able to find any events created with that key.")
        }
      },
    })
  }

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
    {#if $session?.secret}
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
  </FlexColumn>
  <FlexColumn>
    <div class="flex justify-between">
      <div class="flex items-center gap-2">
        <i class="fa fa-server fa-lg" />
        <h2 class="staatliches text-2xl">Group keys</h2>
      </div>
      <Anchor button on:click={startImport}>
        <i class="fa fa-upload" /> Import Key
      </Anchor>
    </div>
  </FlexColumn>
</FlexColumn>

{#if nsec !== null}
  <Modal onEscape={cancelImport}>
    <Heading class="text-center">Import group key</Heading>
    <p>
      Share group administration using a dedicated private key. These keys are still valuable, so
      keep them safe!
    </p>
    <Field label="Private key">
      <Input type="password" bind:value={nsec} placeholder="nsec..." />
    </Field>
    <Field label="Relays to search">
      <SearchSelect
        multiple
        bind:value={relays}
        search={$relaySearch.searchValues}
        placeholder="wss://..." />
    </Field>
    <Anchor button accent loading={importing} on:click={finishImport}>Import key</Anchor>
  </Modal>
{/if}
