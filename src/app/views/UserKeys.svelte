<script lang="ts">
  import {uniqBy, uniq, sortBy, prop} from "ramda"
  import {nip19} from "nostr-tools"
  import {createMap} from "hurdak"
  import CopyValue from "src/partials/CopyValue.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import MobileInset from "src/partials/MobileInset.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import GroupCircle from "src/app/shared/GroupCircle.svelte"
  import GroupName from "src/app/shared/GroupName.svelte"
  import {
    session,
    groupSharedKeys,
    deriveMembershipLevel,
    MembershipLevel,
    groupAdminKeys,
  } from "src/engine"

  const nip07 = "https://github.com/nostr-protocol/nips/blob/master/07.md"
  const keypairUrl = "https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/"

  $: adminKeys = createMap("group", $groupAdminKeys)
  $: sharedKeys = createMap(
    "group",
    uniqBy(
      prop("group"),
      sortBy(
        k => -k.created_at,
        $groupSharedKeys.filter(
          k => deriveMembershipLevel(k.group).get() === MembershipLevel.Private
        )
      )
    )
  )

  $: addresses = uniq([...Object.keys(adminKeys), ...Object.keys(sharedKeys)])

  document.title = "Keys"
</script>

<MobileInset>
  <FlexColumn>
    <div class="flex flex-col items-center justify-center">
      <Heading>Your Keys</Heading>
      <p>
        Your account is identified across the network using a public/private <Anchor
          href={keypairUrl}
          external>keypair</Anchor
        >. This allows you to fully own your account, and move to another app if needed.
      </p>
    </div>
    <div>
      <CopyValue label="Public Key" value={$session?.pubkey} encode={nip19.npubEncode} />
      <small class="text-lightest">
        Your public key identifies your account. You can share this with people trying to find you on
        nostr.
      </small>
    </div>
    {#if $session?.privkey}
      <div>
        <CopyValue
          isPassword
          label="Private Key"
          value={$session?.privkey}
          encode={nip19.nsecEncode} />
        <small class="text-lightest">
          Your private key is used to prove your identity by cryptographically signing messages. <strong
            >Do not share this with anyone.</strong>
          Be careful about copying this into other apps - instead, consider using a <Anchor
            href={nip07}
            external>compatible browser extension</Anchor> to securely store your key.
        </small>
      </div>
    {/if}
    {#if $session?.bunkerKey}
      <div>
        <CopyValue
          isPassword
          label="Bunker Key"
          value={$session?.bunkerKey}
          encode={nip19.nsecEncode} />
        <small class="text-lightest">
          Your bunker key is used to authorize Coracle with your nsec bunker to sign events on your
          behalf. Save this if you would like to log in elsewhere without re-authorizing.
        </small>
      </div>
    {/if}
    {#if addresses.length > 0}
      <div class="flex flex-col items-center justify-center">
        <Heading>Group Keys</Heading>
        <p>
          These keys are used for accessing or managing closed groups. Save these to make sure you
          don't lose access to your groups.
        </p>
      </div>
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
    {/if}
  </FlexColumn>
</MobileInset>
