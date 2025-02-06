<script lang="ts">
  import type {TrustedEvent} from "@welshman/util"
  import {preventDefault} from "@lib/html"
  import Button from "@lib/components/Button.svelte"
  import ProfileName from "@app/components/ProfileName.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import {pushModal} from "@app/modal"

  const {event}: {event: TrustedEvent} = $props()

  const openProfile = () => pushModal(ProfileDetail, {pubkey: event.pubkey})
</script>

<span class="whitespace-nowrap py-1 text-sm opacity-75">
  Posted by
  <Button onclick={preventDefault(openProfile)} class="link-content">
    @<ProfileName pubkey={event.pubkey} />
  </Button>
</span>
