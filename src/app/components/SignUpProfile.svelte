<script lang="ts">
  import type {Profile} from "@welshman/util"
  import {PROFILE, createProfile, makeProfile, createEvent} from "@welshman/util"
  import {loginWithNip01, publishThunk} from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import ProfileEditForm from "@app/components/ProfileEditForm.svelte"
  import {INDEXER_RELAYS} from "@app/state"

  type Props = {
    secret: string
  }

  const {secret}: Props = $props()

  const initialValues = {
    profile: makeProfile(),
    shouldBroadcast: true,
  }

  const onsubmit = ({profile, shouldBroadcast}: {profile: Profile; shouldBroadcast: boolean}) => {
    const event = createEvent(PROFILE, createProfile(profile))
    const relays = shouldBroadcast ? INDEXER_RELAYS : []

    loginWithNip01(secret)
    publishThunk({event, relays})
  }
</script>

<ProfileEditForm hideAddress {initialValues} {onsubmit}>
  {#snippet footer()}
    <Button type="submit" class="btn btn-primary">Create Account</Button>
  {/snippet}
</ProfileEditForm>
