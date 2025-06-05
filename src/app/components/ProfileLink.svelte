<script lang="ts">
  import cx from 'classnames'
  import {preventDefault} from "@lib/html"
  import Button from "@lib/components/Button.svelte"
  import ProfileName from "@app/components/ProfileName.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import {pushModal} from "@app/modal"

  type Props = {
    pubkey: string
    url?: string
    unstyled?: boolean
  }

  const {pubkey, url, unstyled}: Props = $props()

  const openProfile = () => pushModal(ProfileDetail, {pubkey, url})
</script>

<Button onclick={preventDefault(openProfile)} class={cx({'link-content': !unstyled})}>
  @<ProfileName {pubkey} {url} />
</Button>
