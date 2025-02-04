<script lang="ts">
  import {displayProfile} from "@welshman/util"
  import {deriveProfile} from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import {pushModal} from "@app/modal"

  const {value} = $props()

  const profile = deriveProfile(value.pubkey)

  const openProfile = () => pushModal(ProfileDetail, {pubkey: value.pubkey})
</script>

<Button onclick={openProfile} class="link-content">
  @{displayProfile($profile)}
</Button>
