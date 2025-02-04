<script lang="ts">
  import {deriveProfile} from "@welshman/app"
  import Avatar from "@lib/components/Avatar.svelte"

  const {...props} = $props()

  const profile = deriveProfile(props.pubkey)
</script>

<Avatar src={$profile?.picture} icon="user-circle" {...props} />
