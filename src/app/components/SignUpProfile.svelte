<script lang="ts">
  import type {Profile} from "@welshman/util"
  import {PROFILE, createProfile, createEvent} from "@welshman/util"
  import {loginWithNip01, publishThunk} from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import ProfileEditForm from "@app/components/ProfileEditForm.svelte"
  import {INDEXER_RELAYS} from "@app/state"

  type Props = {
    secret: string
  }

  const {secret}: Props = $props()

  const onsubmit = (profile: Profile) => {
    const event = createEvent(PROFILE, createProfile(profile))

    loginWithNip01(secret)
    publishThunk({event, relays: INDEXER_RELAYS})
  }
</script>

<ProfileEditForm hideAddress {onsubmit}>
  {#snippet footer()}
    <Button type="submit" class="btn btn-primary">Create Account</Button>
  {/snippet}
</ProfileEditForm>
