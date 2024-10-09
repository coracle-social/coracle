<script lang="ts">
  import {last, ctx} from "@welshman/lib"
  import {
    createEvent,
    displayPubkey,
    displayProfile,
    makeProfile,
    editProfile,
    createProfile,
    isPublishedProfile,
  } from "@welshman/util"
  import {pubkey, profilesByPubkey, makeThunk, publishThunk, displayNip05} from "@welshman/app"
  import {slide} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import InputProfilePicture from "@lib/components/InputProfilePicture.svelte"
  import Content from "@app/components/Content.svelte"
  import InfoHandle from "@app/components/InfoHandle.svelte"
  import {pushModal} from "@app/modal"
  import {pushToast} from "@app/toast"

  const pubkeyDisplay = displayPubkey($pubkey!)

  const cloneProfile = () => ({...($profilesByPubkey.get($pubkey!) || makeProfile())})

  const toggleEdit = () => {
    editing = !editing

    if (!editing) {
      profile = cloneProfile()
    }
  }

  const stopEdit = () => {
    editing = false
    profile = cloneProfile()
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
  let profile = cloneProfile()
</script>

<div class="content column gap-4">
  <div class="card2 bg-alt shadow-xl">
    <div class="flex justify-between gap-2">
      <div class="flex max-w-full gap-3">
        <div class="py-1">
          <Avatar src={profile?.picture} size={10} />
        </div>
        <div class="flex min-w-0 flex-col">
          <div class="flex items-center gap-2">
            <div class="text-bold overflow-hidden text-ellipsis">
              {displayProfile(profile, pubkeyDisplay)}
            </div>
          </div>
          <div class="overflow-hidden text-ellipsis text-sm opacity-75">
            {profile?.nip05 ? displayNip05(profile.nip05) : pubkeyDisplay}
          </div>
        </div>
      </div>
      <Button class="center btn btn-circle btn-neutral -mr-4 -mt-4 h-12 w-12" on:click={toggleEdit}>
        <Icon icon="pen-new-square" />
      </Button>
    </div>
    {#key profile.about}
      <Content event={{content: profile.about, tags: []}} hideMedia />
    {/key}
  </div>
  {#if editing}
    <form class="card2 bg-alt shadow-xl" transition:slide on:submit|preventDefault={saveEdit}>
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
        <textarea
          class="textarea textarea-bordered leading-4"
          rows="3"
          bind:value={profile.about}
          slot="input" />
      </Field>
      <Field>
        <p slot="label">Nostr Address</p>
        <label class="input input-bordered flex w-full items-center gap-2" slot="input">
          <Icon icon="remote-controller-minimalistic" />
          <input bind:value={profile.nip05} class="grow" type="text" />
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
</div>
