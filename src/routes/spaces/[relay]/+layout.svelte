<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {subscribe} from "@welshman/app"
  import {DELETE, NOTE} from "@welshman/util"
  import Page from "@lib/components/Page.svelte"
  import Delay from "@lib/components/Delay.svelte"
  import SecondaryNav from "@lib/components/SecondaryNav.svelte"
  import MenuSpace from "@app/components/MenuSpace.svelte"
  import {decodeRelay, MEMBERSHIPS, MESSAGE, COMMENT} from "@app/state"

  $: url = decodeRelay($page.params.relay)

  onMount(() => {
    const sub = subscribe({
      filters: [
        {kinds: [DELETE], "#k": [NOTE, COMMENT, MESSAGE].map(String)},
        {kinds: [MEMBERSHIPS], "#r": [url]},
      ],
      relays: [url],
    })

    return () => sub.close()
  })
</script>

{#key url}
  <Delay>
    <SecondaryNav>
      <MenuSpace {url} />
    </SecondaryNav>
    <Page>
      {#key $page.params.room}
        <slot />
      {/key}
    </Page>
  </Delay>
{/key}
