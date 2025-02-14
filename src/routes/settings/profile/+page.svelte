<script lang="ts">
  import {nip19} from "nostr-tools"
  import {hexToBytes} from "@noble/hashes/utils"
  import {displayPubkey, displayProfile} from "@welshman/util"
  import {pubkey, session, displayNip05, deriveProfile} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import FieldInline from "@lib/components/FieldInline.svelte"
  import Button from "@lib/components/Button.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import Content from "@app/components/Content.svelte"
  import ProfileEdit from "@app/components/ProfileEdit.svelte"
  import ProfileDelete from "@app/components/ProfileDelete.svelte"
  import InfoKeys from "@app/components/InfoKeys.svelte"
  import {PLATFORM_NAME} from "@app/state"
  import {pushModal} from "@app/modal"
  import {clip} from "@app/toast"

  const profile = deriveProfile($pubkey!)

  const pubkeyDisplay = displayPubkey($pubkey!)

  const copyNpub = () => clip(nip19.npubEncode($session!.pubkey))

  const copyNsec = () => clip(nip19.nsecEncode(hexToBytes($session!.secret!)))

  const startEdit = () => pushModal(ProfileEdit)

  const startEject = () => pushModal(InfoKeys)

  const startDelete = () => pushModal(ProfileDelete)
</script>

<div class="content column gap-4">
  <div class="card2 bg-alt shadow-xl">
    <div class="flex justify-between gap-2">
      <div class="flex max-w-full gap-3">
        <div class="py-1">
          <Avatar src={$profile?.picture} size={10} />
        </div>
        <div class="flex min-w-0 flex-col">
          <div class="flex items-center gap-2">
            <div class="text-bold overflow-hidden text-ellipsis">
              {displayProfile($profile, pubkeyDisplay)}
            </div>
          </div>
          <div class="overflow-hidden text-ellipsis text-sm opacity-75">
            {$profile?.nip05 ? displayNip05($profile.nip05) : pubkeyDisplay}
          </div>
        </div>
      </div>
      <Button class="center btn btn-circle btn-neutral -mr-4 -mt-4 h-12 w-12" onclick={startEdit}>
        <Icon icon="pen-new-square" />
      </Button>
    </div>
    {#key $profile?.about}
      <Content event={{content: $profile?.about || "", tags: []}} hideMediaAtDepth={0} />
    {/key}
  </div>
  {#if $session?.email}
    <div class="card2 bg-alt col-4 shadow-xl">
      <FieldInline>
        {#snippet label()}
          <p>Email Address</p>
        {/snippet}
        {#snippet input()}
          <label class="input input-bordered flex w-full items-center gap-2">
            <Icon icon="user-rounded" />
            <input readonly value={$session.email} class="grow" />
          </label>
        {/snippet}
        {#snippet info()}
          <p>
            Your email and password can only be used to log into {PLATFORM_NAME}.
            <Button class="link" onclick={startEject}>Start holding your own keys</Button>
          </p>
        {/snippet}
      </FieldInline>
    </div>
  {/if}
  <div class="card2 bg-alt col-4 shadow-xl">
    <FieldInline>
      {#snippet label()}
        <p>Public Key</p>
      {/snippet}
      {#snippet input()}
        <label class="input input-bordered flex w-full items-center justify-between gap-2">
          <div class="row-2 flex-grow items-center">
            <Icon icon="link-round" />
            <input readonly class="ellipsize flex-grow" value={$session?.pubkey} />
          </div>
          <Button class="flex items-center" onclick={copyNpub}>
            <Icon icon="copy" />
          </Button>
        </label>
      {/snippet}
      {#snippet info()}
        <p>
          Your public key is your nostr user identifier. It also allows other people to authenticate
          your messages.
        </p>
      {/snippet}
    </FieldInline>
    {#if $session?.method === "nip01"}
      <FieldInline>
        {#snippet label()}
          <p>Private Key</p>
        {/snippet}
        {#snippet input()}
          <label class="input input-bordered flex w-full items-center gap-2">
            <Icon icon="link-round" />
            <input readonly value={$session.secret} class="grow" type="password" />
            <Button class="flex items-center" onclick={copyNsec}>
              <Icon icon="copy" />
            </Button>
          </label>
        {/snippet}
        {#snippet info()}
          <p>Your private key is your nostr password. Keep this somewhere safe!</p>
        {/snippet}
      </FieldInline>
    {/if}
  </div>
  <div class="card2 bg-alt col-4 shadow-xl">
    <Button class="btn btn-outline btn-error" onclick={startDelete}>
      <Icon icon="trash-bin-2" />
      Delete your profile
    </Button>
  </div>
</div>
