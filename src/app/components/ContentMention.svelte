<script lang="ts">
  import {removeNil} from "@welshman/lib"
  import type {ProfilePointer} from "@welshman/content"
  import {displayProfile} from "@welshman/util"
  import {deriveProfile} from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import {pushModal} from "@app/modal"

  type Props = {
    value: ProfilePointer
    url?: string
  }

  const {value, url}: Props = $props()

  const profile = deriveProfile(value.pubkey, removeNil([url]))

  const openProfile = () => pushModal(ProfileDetail, {pubkey: value.pubkey, url})
</script>

<Button onclick={openProfile} class="link-content">
  @{displayProfile($profile)}
</Button>
