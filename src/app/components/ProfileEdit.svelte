<script lang="ts">
  import {ctx} from "@welshman/lib"
  import type {Profile} from "@welshman/util"
  import {
    createEvent,
    makeProfile,
    editProfile,
    createProfile,
    isPublishedProfile,
  } from "@welshman/util"
  import {pubkey, profilesByPubkey, publishThunk} from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import ProfileEditForm from "@app/components/ProfileEditForm.svelte"
  import {clearModals} from "@app/modal"
  import {pushToast} from "@app/toast"

  const initialValues = {...($profilesByPubkey.get($pubkey!) || makeProfile())}

  const back = () => history.back()

  const onsubmit = (profile: Profile) => {
    const relays = ctx.app.router.FromUser().getUrls()
    const template = isPublishedProfile(profile) ? editProfile(profile) : createProfile(profile)
    const event = createEvent(template.kind, template)

    publishThunk({event, relays})
    pushToast({message: "Your profile has been updated!"})
    clearModals()
  }
</script>

<ProfileEditForm {initialValues} {onsubmit}>
  {#snippet footer()}
    <div class="mt-4 flex flex-row items-center justify-between gap-4">
      <Button class="btn btn-neutral" onclick={back}>Discard Changes</Button>
      <Button type="submit" class="btn btn-primary">Save Changes</Button>
    </div>
  {/snippet}
</ProfileEditForm>
