<script lang="ts">
  import {reject, isNil, find, all, last} from 'ramda'
  import {onDestroy} from 'svelte'
  import {navigate} from 'svelte-routing'
  import {sleep, shuffle} from 'src/util/misc'
  import Content from 'src/partials/Content.svelte'
  import Spinner from 'src/partials/Spinner.svelte'
  import Heading from 'src/partials/Heading.svelte'
  import RelayCardSimple from 'src/partials/RelayCardSimple.svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import Modal from 'src/partials/Modal.svelte'
  import {getUserReadRelays} from 'src/agent/relays'
  import database from 'src/agent/database'
  import network from 'src/agent/network'
  import user from 'src/agent/user'
  import {loadAppData} from 'src/app'

  let message = null
  let mounted = true
  let currentRelays = []
  let attemptedRelays = new Set()
  let knownRelays = database.watch('relays', table => shuffle(table.all()))

  const searchForRelays = async () => {
    if (!mounted) {
      return
    }

    for (let i = 0; i < 8; i++) {
      if (currentRelays[i]) {
        continue
      }

      const relay = find(r => !attemptedRelays.has(r.url), $knownRelays)

      if (!relay) {
        break
      }

      attemptedRelays.add(relay.url)
      currentRelays[i] = relay

      network.loadPeople([user.getPubkey()], {relays: [relay], force: true})
        .then(async () => {
          await sleep(1000)

          currentRelays[i] = null

          if (mounted && getUserReadRelays().length > 0) {
            message = `Success! Just a moment while we get things set up.`

            await Promise.all([
              loadAppData(user.getPubkey()),
              sleep(3000),
            ])

            navigate('/notes/follows')
          }
        })
    }

    if (all(isNil, currentRelays)) {
      message = `
      No luck finding your profile data - you'll need to select your
      relays manually to continue.`

      await sleep(3000)

      navigate('/relays')
    } else {
      setTimeout(searchForRelays, 300)
    }
  }

  const skip = () => {
    navigate('/relays')
  }

  searchForRelays()

  onDestroy(() => {
    mounted = false
  })
</script>

<Content size="lg">
  <Heading class="text-center">Connect to Nostr</Heading>
  <p class="text-left">
    We're searching for your profile on the network. If you'd like to select your
    relays manually instead, click <Anchor on:click={skip}>here</Anchor>.
  </p>
  {#if currentRelays.length > 0}
  <p>Currently searching:</p>
  {#each currentRelays as relay}
  <div class="h-12">
    {#if relay}
    <RelayCardSimple relay={{...relay, description: null}} />
    {/if}
  </div>
  {/each}
  {/if}
</Content>

{#if message}
<Modal nested>
  <Content size="lg" class="text-center">
    {message}
    <Spinner delay={0} />
  </Content>
</Modal>
{/if}
