<script lang="ts">
  import type {ProfilePointer} from "@welshman/content"
  import {displayProfile} from "@welshman/util"
  import Button from "@lib/components/Button.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import {pushModal} from "@app/modal"
  import {deriveAliasedProfile} from "@app/state"

  type Props = {
    value: ProfilePointer
    url?: string
  }

  const {value, url}: Props = $props()

  const profile = deriveAliasedProfile(value.pubkey, url)

  const openProfile = () => pushModal(ProfileDetail, {pubkey: value.pubkey, url})
</script>

<Button onclick={openProfile} class="link-content">
  @{displayProfile($profile)}
</Button>
