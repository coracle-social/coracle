<script lang="ts">
  import Profile from "@app/components/Profile.svelte"

  export let value
</script>

<Profile pubkey={value} />
