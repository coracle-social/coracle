<script lang="ts">
  import type {Profile} from "@welshman/util"
  import {PROFILE, createProfile, createEvent} from "@welshman/util"
  import {addSession, publishThunk} from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import ProfileEditForm from "@app/components/ProfileEditForm.svelte"
  import {INDEXER_RELAYS} from "@app/state"

  type Props = {
    secret: string
    pubkey: string
  }

  const {secret, pubkey}: Props = $props()

  const onsubmit = (profile: Profile) => {
    const event = createEvent(PROFILE, createProfile(profile))

    addSession({method: "nip01", secret, pubkey})
    publishThunk({event, relays: INDEXER_RELAYS})
  }
</script>

<ProfileEditForm hideAddress {onsubmit}>
  {#snippet footer()}
    <Button type="submit" class="btn btn-primary">Create Account</Button>
  {/snippet}
</ProfileEditForm>
