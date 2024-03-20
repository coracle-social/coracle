<script lang="ts">
  import {uniqBy, uniq, sortBy, prop} from "ramda"
  import {createMap} from "hurdak"
  import {nip19} from "nostr-tools"
  import {nsecEncode} from "src/util/nostr"
  import CopyValue from "src/partials/CopyValue.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import GroupCircle from "src/app/shared/GroupCircle.svelte"
  import GroupName from "src/app/shared/GroupName.svelte"
  import {session, groupSharedKeys, deriveIsGroupMember, groupAdminKeys} from "src/engine"

  const nip07 = "https://github.com/nostr-protocol/nips/blob/master/07.md"
  const keypairUrl = "https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/"

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
  <div class="flex items-center gap-2">
    <i class="fa fa-server fa-lg" />
    <h2 class="staatliches text-2xl">Group keys</h2>
  </div>
  <p>
    These keys are used for accessing or managing closed groups. Save these to make sure you don't
    lose access to your groups.
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
  {:else}
    <p class="text-center">No group keys found</p>
  {/each}
</FlexColumn>
