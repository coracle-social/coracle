<script lang="ts">
  import Avatar from "@lib/components/Avatar.svelte"
  import {deriveAlias} from "@app/state"

  type Props = {
    pubkey: string
    url?: string
  } & Record<string, any>

  const {pubkey, url, ...props}: Props = $props()

  const alias = deriveAlias(pubkey, url)
</script>

<Avatar src={$alias?.profile?.picture} icon="user-circle" {...props} />
