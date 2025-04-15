<script lang="ts">
  import Avatar from "@lib/components/Avatar.svelte"
  import {deriveAliasedProfile} from "@app/state"

  type Props = {
    pubkey: string
    url?: string
  } & Record<string, any>

  const {pubkey, url, ...props}: Props = $props()

  const profile = deriveAliasedProfile(pubkey, url)
</script>

<Avatar src={$profile?.picture} icon="user-circle" {...props} />
