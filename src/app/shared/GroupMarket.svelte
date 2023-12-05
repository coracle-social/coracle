<script lang="ts">
  import Feed from 'src/app/shared/Feed.svelte'

  export let group
  export let relays
</script>

<Feed hideControls {relays} filter={{kinds: [30402], '#a': [$group.address]}} />
