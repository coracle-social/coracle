<script lang="ts">
  import {nip19} from "nostr-tools"
  import {hexToBytes} from "@noble/hashes/utils"
  import {displayPubkey, displayProfile} from "@welshman/util"
  import {pubkey, session, displayNip05, deriveProfile} from "@welshman/app"
  import {slide} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import FieldInline from "@lib/components/FieldInline.svelte"
  import Button from "@lib/components/Button.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import Content from "@app/components/Content.svelte"
  import ProfileEdit from "@app/components/ProfileEdit.svelte"
  import {pushModal} from "@app/modal"
  import {clip} from "@app/toast"

  const profile = deriveProfile($pubkey!)

  const pubkeyDisplay = displayPubkey($pubkey!)

  const copyNpub = () => clip(nip19.npubEncode($session!.pubkey))

  const copyNsec = () => clip(nip19.nsecEncode(hexToBytes($session!.secret!)))

  const startEdit = () => pushModal(ProfileEdit)
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
      <Button class="center btn btn-circle btn-neutral -mr-4 -mt-4 h-12 w-12" on:click={startEdit}>
        <Icon icon="pen-new-square" />
      </Button>
    </div>
    {#key $profile?.about}
      <Content event={{content: $profile?.about || "", tags: []}} hideMedia />
    {/key}
  </div>
  <div class="card2 bg-alt col-4 shadow-xl" transition:slide>
    <FieldInline>
      <p slot="label">Public Key</p>
      <label class="input input-bordered flex w-full items-center gap-2" slot="input">
        <Icon icon="link-round" />
        <input value={$session?.pubkey} class="grow" type="text" />
        <Button class="flex items-center" on:click={copyNpub}>
          <Icon icon="copy" />
        </Button>
      </label>
      <p slot="info">
        Your public key is your nostr user identifier. It also allows other people to authenticate
        your messages.
      </p>
    </FieldInline>
    {#if $session?.method === "nip01"}
      <FieldInline>
        <p slot="label">Private Key</p>
        <label class="input input-bordered flex w-full items-center gap-2" slot="input">
          <Icon icon="link-round" />
          <input value={$session.secret} class="grow" type="password" />
          <Button class="flex items-center" on:click={copyNsec}>
            <Icon icon="copy" />
          </Button>
        </label>
        <p slot="info">Your private key is your nostr password. Keep this somewhere safe!</p>
      </FieldInline>
    {/if}
  </div>
</div>
