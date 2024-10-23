<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {load} from "@welshman/app"
  import Page from "@lib/components/Page.svelte"
  import Delay from "@lib/components/Delay.svelte"
  import SecondaryNav from "@lib/components/SecondaryNav.svelte"
  import MenuSpace from "@app/components/MenuSpace.svelte"
  import {decodeRelay, MEMBERSHIPS} from "@app/state"

  $: url = decodeRelay($page.params.relay)

  onMount(() => {
    load({
      filters: [{kinds: [MEMBERSHIPS], "#r": [url]}],
      relays: [url],
    })
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
