<script lang="ts">
  import {isNil, prop, uniqBy, objOf, find, all} from "ramda"
  import {sleep, shuffle} from "hurdak"
  import {onDestroy, onMount} from "svelte"
  import {navigate} from "svelte-routing"
  import {userKinds} from "src/util/nostr"
  import {toast} from "src/partials/state"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Input from "src/partials/Input.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Modal from "src/partials/Modal.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {
    env,
    session,
    relays,
    pool,
    loadPubkeys,
    getUserRelayUrls,
    normalizeRelayUrl,
  } from "src/engine"
  import {loadAppData} from "src/app/state"

  let modal = null
  let customRelayUrl = null
  let searching = true
  let currentRelays = {} as Record<number, {url: string}>
  let attemptedRelays = new Set()
  let customRelays = []
  let allRelays = []
  let knownRelays = relays.derived($relays =>
    uniqBy(
      prop("url"),
      // Make sure our hardcoded urls are first, since they're more likely to find a match
      $env.DEFAULT_RELAYS.map(objOf("url")).concat(shuffle($relays))
    )
  )

  $: allRelays = $knownRelays.concat(customRelays)

  const searchForRelays = async () => {
    if (!searching) {
      return
    }

    for (let i = 0; i < 8; i++) {
      if (currentRelays[i]) {
        continue
      }

      const relay = find(r => !attemptedRelays.has(r.url), allRelays)

      if (!relay) {
        break
      }

      attemptedRelays.add(relay.url)
      currentRelays[i] = relay

      // Wait a bit before removing the relay to smooth out the ui
      Promise.all([
        sleep(1500),
        loadPubkeys([$session.pubkey], {
          force: true,
          relays: [relay.url],
          kinds: userKinds,
        }),
      ]).then(async () => {
        currentRelays[i] = null

        if (searching && getUserRelayUrls().length > 0) {
          searching = false
          modal = "success"

          // Reload everything, it's possible we didn't get their petnames if we got a match
          // from something like purplepag.es. This helps us avoid nuking follow lists later
          await Promise.all([loadAppData(), sleep(1500)])

          navigate("/notes")
        } else {
          pool.remove(relay.url)
        }
      })
    }

    // Wait for our relay list to load initially, then terminate when we've tried everything
    if (allRelays.length > 0 && all(isNil, Object.values(currentRelays)) && isNil(customRelayUrl)) {
      modal = "failure"
      customRelayUrl = ""
    }

    setTimeout(searchForRelays, 300)
  }

  const addCustomRelay = () => {
    const url = normalizeRelayUrl(customRelayUrl)

    if (!url) {
      return toast.show("error", "That isn't a valid relay url")
    }

    customRelays = [{url: customRelayUrl}].concat(customRelays)
    customRelayUrl = null
    modal = null
  }

  onMount(() => {
    searchForRelays()
  })

  onDestroy(() => {
    searching = false
  })
</script>

<Content size="lg">
  <Heading class="text-center">Connect to Nostr</Heading>
  <p class="text-left">
    We're searching for your profile on the network. If you'd like to select your relays manually
    instead, click <Anchor
      theme="anchor"
      on:click={() => {
        customRelayUrl = ""
        modal = "custom"
      }}>here</Anchor
    >.
  </p>
  {#if $env.FORCE_RELAYS.length > 0}
    <Spinner />
  {:else if Object.values(currentRelays).length > 0}
    <p>Currently searching:</p>
    {#each Object.values(currentRelays) as relay}
      <div class="h-12">
        {#if relay}
          <RelayCard hideActions relay={{...relay, description: null}} />
        {/if}
      </div>
    {/each}
  {/if}
</Content>

{#if modal}
  <Modal
    onEscape={modal === "success"
      ? null
      : () => {
          modal = null
        }}>
    <Content>
      {#if modal === "success"}
        <div class="my-12 text-center">Success! Just a moment while we get things set up.</div>
        <Spinner delay={0} />
      {:else if modal === "failure"}
        <div class="my-12 text-center">
          We didn't have any luck finding your profile data - you'll need to select your relays
          manually to continue. You can skip this step by clicking
          <Anchor class="underline" href="/relays">here</Anchor>, but be aware that any new relay
          selections will replace your old ones.
        </div>
      {:else if modal === "custom"}
        <div class="my-12 text-center">
          Enter the url of a relay you've used in the past to store your profile and we'll check
          there.
        </div>
      {/if}

      {#if ["failure", "custom"].includes(modal)}
        <form class="flex gap-2" on:submit|preventDefault={addCustomRelay}>
          <Input bind:value={customRelayUrl} wrapperClass="flex-grow">
            <i slot="before" class="fa fa-search" />
          </Input>
          <Anchor theme="button" on:click={addCustomRelay}>Search relay</Anchor>
        </form>
      {/if}
    </Content>
  </Modal>
{/if}
