<script lang="ts">
  import {nip19} from 'nostr-tools'
  import {hexToBytes} from "@noble/hashes/utils"
  import {ctx} from "@welshman/lib"
  import {
    createEvent,
    displayPubkey,
    displayProfile,
    makeProfile,
    editProfile,
    createProfile,
    isPublishedProfile,
  } from "@welshman/util"
  import {pubkey, session, publishThunk, displayNip05, deriveProfile} from "@welshman/app"
  import {slide} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import FieldInline from "@lib/components/FieldInline.svelte"
  import Button from "@lib/components/Button.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import InputProfilePicture from "@lib/components/InputProfilePicture.svelte"
  import Content from "@app/components/Content.svelte"
  import InfoHandle from "@app/components/InfoHandle.svelte"
  import {pushModal} from "@app/modal"
  import {pushToast, clip} from "@app/toast"

  const profile = deriveProfile($pubkey!)

  const pubkeyDisplay = displayPubkey($pubkey!)

  const copyNpub = () => clip(nip19.npubEncode($session!.pubkey))

  const copyNsec = () => clip(nip19.nsecEncode(hexToBytes($session!.secret!)))

  const cloneProfile = () => ({...($profile || makeProfile())})

  const toggleEdit = () => {
    editing = !editing

    if (!editing) {
      values = cloneProfile()
    }
  }

  const stopEdit = () => {
    editing = false
    values = cloneProfile()
  }

  const saveEdit = () => {
    const relays = ctx.app.router.WriteRelays().getUrls()
    const template = isPublishedProfile(values) ? editProfile(values) : createProfile(values)
    const event = createEvent(template.kind, template)

    publishThunk({event, relays})
    pushToast({message: "Your profile has been updated!"})
    editing = false
  }

  let file: File
  let editing = false
  let values = cloneProfile()

  $: display = editing ? values : $profile
</script>

<div class="content column gap-4">
  <div class="card2 bg-alt shadow-xl">
    <div class="flex justify-between gap-2">
      <div class="flex max-w-full gap-3">
        <div class="py-1">
          <Avatar src={display?.picture} size={10} />
        </div>
        <div class="flex min-w-0 flex-col">
          <div class="flex items-center gap-2">
            <div class="text-bold overflow-hidden text-ellipsis">
              {displayProfile(display, pubkeyDisplay)}
            </div>
          </div>
          <div class="overflow-hidden text-ellipsis text-sm opacity-75">
            {display?.nip05 ? displayNip05(display.nip05) : pubkeyDisplay}
          </div>
        </div>
      </div>
      <Button class="center btn btn-circle btn-neutral -mr-4 -mt-4 h-12 w-12" on:click={toggleEdit}>
        <Icon icon="pen-new-square" />
      </Button>
    </div>
    {#key display?.about}
      <Content event={{content: display?.about || "", tags: []}} hideMedia />
    {/key}
  </div>
  {#if editing}
    <form class="card2 bg-alt shadow-xl col-4" transition:slide on:submit|preventDefault={saveEdit}>
      <div class="flex justify-center py-2">
        <InputProfilePicture bind:file bind:url={values.picture} />
      </div>
      <Field>
        <p slot="label">Username</p>
        <label class="input input-bordered flex w-full items-center gap-2" slot="input">
          <Icon icon="user-circle" />
          <input bind:value={values.name} class="grow" type="text" />
        </label>
      </Field>
      <Field>
        <p slot="label">About You</p>
        <textarea
          class="textarea textarea-bordered leading-4"
          rows="3"
          bind:value={values.about}
          slot="input" />
      </Field>
      <Field>
        <p slot="label">Nostr Address</p>
        <label class="input input-bordered flex w-full items-center gap-2" slot="input">
          <Icon icon="map-point" />
          <input bind:value={values.nip05} class="grow" type="text" />
        </label>
        <p slot="info">
          <Button class="link" on:click={() => pushModal(InfoHandle)}
            >What is a nostr address?</Button>
        </p>
      </Field>
      <div class="mt-4 flex flex-row items-center justify-between gap-4">
        <Button class="btn btn-neutral" on:click={stopEdit}>Discard Changes</Button>
        <Button type="submit" class="btn btn-primary">Save Changes</Button>
      </div>
    </form>
  {/if}
  {#if $session?.method === "nip01"}
    <div class="card2 bg-alt shadow-xl col-4" transition:slide>
      <FieldInline>
        <p slot="label">Public Key</p>
        <label class="input input-bordered flex w-full items-center gap-2" slot="input">
          <Icon icon="link-round" />
          <input value={$session.pubkey} class="grow" type="text" />
          <Button class="flex items-center" on:click={copyNpub}>
            <Icon icon="copy" />
          </Button>
        </label>
        <p slot="info">
          Your public key is your nostr user identifier. It also allows other people to
          authenticate your messages.
        <p>
      </FieldInline>
      <FieldInline>
        <p slot="label">Private Key</p>
        <label class="input input-bordered flex w-full items-center gap-2" slot="input">
          <Icon icon="link-round" />
          <input value={$session.secret} class="grow" type="password" />
          <Button class="flex items-center" on:click={copyNsec}>
            <Icon icon="copy" />
          </Button>
        </label>
        <p slot="info">
          Your private key is your nostr password. Keep this somewhere safe!
        <p>
      </FieldInline>
    </div>
  {/if}
</div>
