<script lang="ts">
  import {reject, last} from 'ramda'
  import {onDestroy} from 'svelte'
  import {navigate} from 'svelte-routing'
  import {sleep, shuffle} from 'src/util/misc'
  import Content from 'src/partials/Content.svelte'
  import Spinner from 'src/partials/Spinner.svelte'
  import Heading from 'src/partials/Heading.svelte'
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

  const searchSample = async () => {
    if (!mounted) {
      return
    }

    currentRelays = reject(r => attemptedRelays.has(r.url), $knownRelays).slice(0, 10)
    currentRelays.forEach(({url}) => attemptedRelays.add(url))

    if (currentRelays.length === 0) {
      message = `
      No luck finding your profile data - you'll need to select your
      relays manually to continue.`

      await sleep(3000)

      navigate('/relays')
    } else {
      await network.loadPeople([user.getPubkey()], {relays: currentRelays})

      if (getUserReadRelays().length > 0) {
        message = `Success! Just a moment while we get things set up.`

        await Promise.all([
          loadAppData(user.getPubkey()),
          sleep(3000),
        ])

        navigate('/notes/network')
      } else {
        await sleep(1000)

        searchSample()
      }
    }
  }

  const skip = () => {
    navigate('/notes/network')
  }

  searchSample()

  onDestroy(() => {
    mounted = false
  })
</script>

<Content size="lg" class="text-center">
  <Heading>Connect to Nostr</Heading>
  <p class="text-left">
    We're searching for your profile on the network. If you'd like to select your
    relays manually instead, click <Anchor on:click={skip}>here</Anchor>.
  </p>
  {#if currentRelays.length > 0}
  <p class="text-left">
    Currently searching:
  </p>
  <ul class="text-left list-disc ml-6">
    {#each currentRelays as relay}
      <li>{last(relay.url.split('://'))}</li>
    {/each}
  </ul>
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
