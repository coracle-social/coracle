<script lang="ts">
  import Feeds from "src/app/views/Feeds.svelte"
  import GroupDetail from "src/app/views/GroupDetail.svelte"
  import {env} from "src/engine"
</script>

{#if $env.FORCE_GROUP}
  <GroupDetail address={$env.FORCE_GROUP} activeTab="notes" />
{:else}
  <Feeds />
{/if}
