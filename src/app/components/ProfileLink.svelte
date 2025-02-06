<script lang="ts">
  import {preventDefault} from "@lib/html"
  import Button from "@lib/components/Button.svelte"
  import ProfileName from "@app/components/ProfileName.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import {pushModal} from "@app/modal"

  const {pubkey}: {pubkey: string} = $props()

  const openProfile = () => pushModal(ProfileDetail, {pubkey})
</script>

<Button onclick={preventDefault(openProfile)} class="link-content">
  @<ProfileName {pubkey} />
</Button>
