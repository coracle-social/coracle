<script lang="ts">
  import {nip19} from 'nostr-tools'
  import {last, ctx} from "@welshman/lib"
  import {PROFILE, createEvent, displayPubkey, displayProfile, makeProfile, editProfile, createProfile, isPublishedProfile} from "@welshman/util"
  import {pubkey, getProfile, displayHandle, makeThunk, publishThunk} from "@welshman/app"
  import {slide} from '@lib/transition'
  import Icon from "@lib/components/Icon.svelte"
  import Field from '@lib/components/Field.svelte'
  import Button from "@lib/components/Button.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import InputProfilePicture from "@lib/components/InputProfilePicture.svelte"
  import Content from '@app/components/Content.svelte'
  import InfoHandle from '@app/components/InfoHandle.svelte'
  import {pushModal} from "@app/modal"
  import {pushToast} from "@app/toast"

  const npub = nip19.npubEncode($pubkey!)
  const pubkeyDisplay = displayPubkey($pubkey!)

  const displayNip05 = (nip05: string) =>
    nip05?.startsWith("_@") ? last(nip05.split("@")) : nip05

  const toggleEdit = () => {
    editing = !editing
  }

  const stopEdit = () => {
    editing = false
    profile = getProfile($pubkey!) || makeProfile()
  }

  const saveEdit = () => {
    const relays = ctx.app.router.WriteRelays().getUrls()
    const template = isPublishedProfile(profile) ? editProfile(profile) : createProfile(profile)
    const event = createEvent(template.kind, template)

    publishThunk(makeThunk({event, relays}))
    pushToast({message: "Your profile has been updated!"})
    editing = false
  }

  let file: File
  let editing = false
  let profile = getProfile($pubkey!) || makeProfile()
</script>

<div class="content column gap-4">
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <div class="flex gap-2 justify-between">
        <div class="flex gap-3 max-w-full">
          <div class="py-1">
            <Avatar src={profile?.picture} size={10} />
          </div>
          <div class="flex flex-col min-w-0">
            <div class="flex gap-2 items-center">
              <div class="text-bold text-ellipsis overflow-hidden">
                {displayProfile(profile, pubkeyDisplay)}
              </div>
            </div>
            <div class="text-sm opacity-75 text-ellipsis overflow-hidden">
              {profile?.nip05 ? displayNip05(profile.nip05) : pubkeyDisplay}
            </div>
          </div>
        </div>
        <Button class="btn btn-neutral btn-circle w-12 h-12 center -mt-4 -mr-4" on:click={toggleEdit}>
          <Icon icon="pen-new-square" />
        </Button>
      </div>
      {#key profile.about}
        <Content event={{content: profile.about, tags: []}} hideMedia />
      {/key}
    </div>
  </div>
  {#if editing}
    <form class="card bg-base-100 shadow-xl" transition:slide on:submit|preventDefault={saveEdit}>
      <div class="card-body">
        <div class="flex justify-center py-2">
          <InputProfilePicture bind:file bind:url={profile.picture} />
        </div>
        <Field>
          <p slot="label">Username</p>
          <label class="input input-bordered flex w-full items-center gap-2" slot="input">
            <Icon icon="user-circle" />
            <input bind:value={profile.name} class="grow" type="text" />
          </label>
        </Field>
        <Field>
          <p slot="label">About You</p>
          <textarea class="textarea textarea-bordered leading-4" rows="3" bind:value={profile.about} slot="input" />
        </Field>
        <Field>
          <p slot="label">Address</p>
          <label class="input input-bordered flex w-full items-center gap-2" slot="input">
            <Icon icon="remote-controller-minimalistic" />
            <input bind:value={profile.nip05} class="grow" type="text" />
          </label>
          <p slot="info">
            <Button class="link" on:click={() => pushModal(InfoHandle)}>What is a nostr address?</Button>
          </p>
        </Field>
        <div class="flex flex-row items-center justify-between gap-4 mt-4">
          <Button class="btn btn-neutral" on:click={stopEdit}>
            Discard Changes
          </Button>
          <Button type="submit" class="btn btn-primary">
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  {/if}
</div>
