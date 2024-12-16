<script lang="ts">
  import Link from "@lib/components/Link.svelte"
  import CardButton from "@lib/components/CardButton.svelte"
  import SpaceAvatar from "@app/components/SpaceAvatar.svelte"
  import RelayName from "@app/components/RelayName.svelte"
  import RelayDescription from "@app/components/RelayDescription.svelte"
  import {makeSpacePath} from "@app/routes"
  import {notifications} from "@app/notifications"

  export let url

  const path = makeSpacePath(url)
</script>

<Link replaceState href={path}>
  <CardButton>
    <div slot="icon"><SpaceAvatar {url} /></div>
    <div slot="title" class="flex gap-1">
      <RelayName {url} />
      {#if $notifications.has(path)}
        <div class="relative top-1 h-2 w-2 rounded-full bg-primary" />
      {/if}
    </div>
    <div slot="info"><RelayDescription {url} /></div>
  </CardButton>
</Link>
