<script lang="ts">
  import {displayProfile} from "@welshman/util"
  import {deriveProfile} from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import {pushDrawer} from "@app/modal"

  export let value

  const profile = deriveProfile(value.pubkey)

  const onClick = (e: Event) => {
    e.stopPropagation()
    pushDrawer(ProfileDetail, {pubkey: value.pubkey})
  }
</script>

<Button on:click={onClick} class="link-content">
  @{displayProfile($profile)}
</Button>
