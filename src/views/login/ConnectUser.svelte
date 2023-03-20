<script lang="ts">
  import type {Relay} from "src/util/types"
  import {isNil, find, all, last} from "ramda"
  import {onDestroy, onMount} from "svelte"
  import {navigate} from "svelte-routing"
  import {sleep, shuffle} from "src/util/misc"
  import {isRelay, userKinds} from "src/util/nostr"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Input from "src/partials/Input.svelte"
  import Heading from "src/partials/Heading.svelte"
  import RelayCardSimple from "src/partials/RelayCardSimple.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Modal from "src/partials/Modal.svelte"
  import {watch} from "src/agent/storage"
  import network from "src/agent/network"
  import user from "src/agent/user"
  import pool from "src/agent/pool"
  import {loadAppData} from "src/app"
  import {toast} from "src/app/ui"

  let modal = null
  let customRelayUrl = null
  let searching = true
  let currentRelays = {} as Record<number, Relay>
  let attemptedRelays = new Set()
  let customRelays = []
  let knownRelays = watch("relays", table => shuffle(table.all()))
  let allRelays = []

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

      network
        .loadPeople([user.getPubkey()], {relays: [relay], force: true, kinds: userKinds})
        .then(async () => {
          // Wait a bit before removing the relay to smooth out the ui
          await sleep(1000)

          currentRelays[i] = null

          // Make sure we have relays and follows before calling it good. This helps us avoid
          // nuking follow lists later on
          if (searching && user.getRelays().length > 0 && user.getPetnames().length > 0) {
            searching = false
            modal = "success"

            await Promise.all([loadAppData(user.getPubkey()), sleep(3000)])

            navigate("/notes/follows")
          } else {
            pool.disconnect(relay.url)
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
    if (!customRelayUrl.startsWith("ws")) {
      customRelayUrl = "wss://" + last(customRelayUrl.split("://"))
    }

    if (!isRelay(customRelayUrl)) {
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
      on:click={() => {
        customRelayUrl = ""
        modal = "custom"
      }}>here</Anchor
    >.
  </p>
  {#if pool.forceRelays.length > 0}
    <Spinner />
  {:else if Object.values(currentRelays).length > 0}
    <p>Currently searching:</p>
    {#each Object.values(currentRelays) as relay}
      <div class="h-12">
        {#if relay}
          <RelayCardSimple relay={{...relay, description: null}} />
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
          <Anchor href="/relays">here</Anchor>, but be aware that any new relay selections will
          replace your old ones.
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
          <Anchor type="button" on:click={addCustomRelay}>Search relay</Anchor>
        </form>
      {/if}
    </Content>
  </Modal>
{/if}
