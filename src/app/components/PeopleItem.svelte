<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Profile from "@app/components/Profile.svelte"
  import ProfileInfo from "@app/components/ProfileInfo.svelte"
  import ProfileBadges from "@app/components/ProfileBadges.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import {pushModal} from "@app/modal"

  type Props = {
    pubkey: string
    url?: string
  }

  const {pubkey, url}: Props = $props()

  const openProfile = () => pushModal(ProfileDetail, {pubkey, url})
</script>

<div class="card2 bg-alt flex flex-col gap-4 shadow-xl">
  <div class="flex justify-between">
    <Profile {pubkey} {url} />
    <Button onclick={openProfile} class="btn btn-primary hidden sm:flex">
      <Icon icon="user-circle" />
      View Profile
    </Button>
  </div>
  <ProfileInfo {pubkey} {url} />
  <ProfileBadges {pubkey} {url} />
  <Button onclick={openProfile} class="btn btn-primary sm:hidden">
    <Icon icon="user-circle" />
    View Profile
  </Button>
</div>
