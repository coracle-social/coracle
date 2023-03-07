<script lang="ts">
  import {find, propEq} from 'ramda'
  import {onMount} from 'svelte'
  import {poll} from "src/util/misc"
  import Toggle from "src/partials/Toggle.svelte"
  import RelayCard from "src/partials/RelayCard.svelte"
  import pool from 'src/agent/pool'
  import user from "src/agent/user"
  import {loadAppData} from 'src/app'

  export let relay
  export let theme = 'dark'
  export let showControls = false

  let quality = null
  let message = null
  let joined = false

  const {relays, canPublish} = user

  $: joined = find(propEq('url', relay.url), $relays)

  const removeRelay = ({url}) => user.removeRelay(url)

  const addRelay = async ({url}) => {
    await user.addRelay(url)

    if (!user.getProfile()?.kind0) {
      loadAppData(user.getPubkey())
    }
  }

  onMount(() => {
    return poll(10_000, async () => {
      const conn = await pool.getConnection(relay.url)

      if (conn) {
        [quality, message] = conn.getQuality()
      } else {
        quality = null
        message = "Not connected"
      }
    })
  })
</script>

<RelayCard
  {relay} {theme}
  addRelay={!joined && $canPublish ? addRelay : null}
  removeRelay={joined && $relays.length > 1 && canPublish ? removeRelay : null}>
  <div slot="controls" class="flex justify-between gap-2">
    {#if showControls && $canPublish}
    <span>Publish to this relay?</span>
    <Toggle
      value={relay.write}
      on:change={() => user.setRelayWriteCondition(relay.url, !relay.write)} />
    {/if}
  </div>
</RelayCard>
