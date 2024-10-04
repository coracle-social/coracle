<script lang="ts">
  import {deriveProfile} from '@welshman/app'
  import Avatar from '@lib/components/Avatar.svelte'

  export let pubkey

  const profile = deriveProfile(pubkey)
</script>

<Avatar src={$profile?.picture} icon="user-circle" {...$$props} />
