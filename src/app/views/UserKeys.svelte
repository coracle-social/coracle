<script lang="ts">
  import {uniqBy, uniq, sortBy, prop} from "ramda"
  import {createMap} from "hurdak"
  import {getAddress} from "paravel"
  import {nip19} from "nostr-tools"
  import {nsecEncode, giftWrapKinds, isKeyValid, getPublicKey, toHex} from "src/util/nostr"
  import {toast} from "src/partials/state"
  import CopyValue from "src/partials/CopyValue.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import Modal from "src/partials/Modal.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import GroupCircle from "src/app/shared/GroupCircle.svelte"
  import GroupName from "src/app/shared/GroupName.svelte"
  import {
    nip59,
    session,
    hints,
    groupSharedKeys,
    deriveIsGroupMember,
    groupAdminKeys,
    subscribe,
  } from "src/engine"

  const nip07 = "https://github.com/nostr-protocol/nips/blob/master/07.md"
  const keypairUrl = "https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/"

  let nsec = null

  const startImport = () => {
    nsec = ""
  }

  const cancelImport = () => {
    nsec = null
  }

  const finishImport = async () => {
    const privkey = nsec.startsWith("nsec") ? toHex(nsec) : nsec

    if (!isKeyValid(privkey)) {
      toast.show("warning", "Sorry, but that's an invalid private key.")
      return
    }

    const pubkey = getPublicKey(privkey)

    let found

    // Look for group definition events by this pubkey so we can associate the key with the group
    const sub = subscribe({
      timeout: 3000,
      relays: hints.User().getUrls(),
      filters: [
        {kinds: [35834], authors: [pubkey], limit: 1},
        {kinds: giftWrapKinds, "#p": [pubkey], limit: 500},
      ],
      onEvent: async event => {
        if (giftWrapKinds.includes(event.kind)) {
          event = await $nip59.unwrap(event, privkey)
        }

        if (event.kind !== 35834 || event.pubkey !== pubkey) {
          return
        }

        found = event
        sub.close()
        groupAdminKeys.key(pubkey).set({
          group: getAddress(event),
          pubkey,
          privkey,
          created_at: event.created_at,
          hints: hints.Event(event).getUrls(),
        })
      },
      onClose: () => {
        if (found) {
          nsec = null
          toast.show("info", "Successfully imported admin key!")
        } else {
          toast.show("warning", "Sorry, we weren't able to find any events created with that key.")
        }
      },
    })
  }

  $: adminKeys = createMap("group", $groupAdminKeys)
  $: sharedKeys = createMap(
    "group",
    uniqBy(
      prop("group"),
      sortBy(
        k => -k.created_at,
        $groupSharedKeys.filter(k => deriveIsGroupMember(k.group).get()),
      ),
    ),
  )

  $: addresses = uniq([...Object.keys(adminKeys), ...Object.keys(sharedKeys)])

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
    {#if $session?.privkey}
      <div>
        <CopyValue isPassword label="Private Key" value={$session?.privkey} encode={nsecEncode} />
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
  {#if addresses.length > 0}
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
      <p>
        These keys are used for accessing or managing closed groups. Save these to make sure you
        don't lose access to your groups.
      </p>
      {#each addresses as address (address)}
        {@const sharedKey = sharedKeys[address]}
        {@const adminKey = adminKeys[address]}
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-2">
            <GroupCircle class="h-4 w-4" {address} />
            <GroupName class="font-bold" {address} />
          </div>
          <div class="ml-6 flex flex-col gap-4">
            {#if sharedKey}
              <CopyValue isPassword label="Access key" value={sharedKey.privkey} />
            {/if}
            {#if adminKey}
              <CopyValue isPassword label="Admin key" value={adminKey.privkey} />
            {/if}
          </div>
        </div>
      {/each}
    </FlexColumn>
  {/if}
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
    <Anchor button accent on:click={finishImport}>Import key</Anchor>
  </Modal>
{/if}
