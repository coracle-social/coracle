<script lang="ts">
  import Link from "@lib/components/Link.svelte"
  import CardButton from "@lib/components/CardButton.svelte"
  import SpaceAvatar from "@app/components/SpaceAvatar.svelte"
  import RelayName from "@app/components/RelayName.svelte"
  import RelayDescription from "@app/components/RelayDescription.svelte"
  import {makeSpacePath} from "@app/routes"
  import {notifications} from "@app/notifications"

  const {url} = $props()

  const path = makeSpacePath(url)
</script>

<Link replaceState href={path}>
  <CardButton>
    {#snippet icon()}
      <div><SpaceAvatar {url} /></div>
    {/snippet}
    {#snippet title()}
      <div class="flex gap-1">
        <RelayName {url} />
        {#if $notifications.has(path)}
          <div class="relative top-1 h-2 w-2 rounded-full bg-primary"></div>
        {/if}
      </div>
    {/snippet}
    {#snippet info()}
      <div><RelayDescription {url} /></div>
    {/snippet}
  </CardButton>
</Link>
