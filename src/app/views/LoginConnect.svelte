<script lang="ts">
  import {onMount} from "svelte"
  import {sleep, spec} from "@welshman/lib"
  import {
    RELAYS,
    FOLLOWS,
    PROFILE,
    getRelayTagValues,
    normalizeRelayUrl,
    isRelayUrl,
  } from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {session, repository} from "@welshman/app"
  import {showWarning} from "src/partials/Toast.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import Button from "src/partials/Button.svelte"
  import {router} from "src/app/util/router"
  import {env, myLoad} from "src/engine"
  import {loadUserData} from "src/app/state"

  const t = Date.now()

  const kinds = [PROFILE, RELAYS, FOLLOWS]
  const filters = [{kinds, authors: [$session.pubkey]}]
  const events = deriveEvents({repository, filters})

  const skip = () => router.at("notes").push()

  const searchRelays = relays => myLoad({filters, relays})

  const confirmCustomRelay = () => {
    const url = normalizeRelayUrl(customRelay)

    if (isRelayUrl(url)) {
      searchRelays([url])
      customRelay = ""
      closeModal()
    } else {
      showWarning("Please enter a valid relay url")
    }
  }

  const tryDefaultRelays = () => {
    // Pull out all the stops to try to find the user's profile
    searchRelays([...env.DEFAULT_RELAYS, ...env.INDEXER_RELAYS])
  }

  const openModal = m => {
    modal = m
  }

  const closeModal = () => {
    modal = null
  }

  let found, showFound, failed, modal
  let customRelay = ""

  tryDefaultRelays()

  $: {
    const relaySelectionsEvent = $events.find(spec({kind: RELAYS}))

    if (!found && relaySelectionsEvent) {
      searchRelays(getRelayTagValues(relaySelectionsEvent.tags))
    }
  }

  $: {
    if (!found && $events.length === 3) {
      found = true

      // Reload user data and pull in messages, notifications, etc
      loadUserData()

      // Show a success message once they've had time to read the intro message
      sleep(Math.max(0, 2500 - (Date.now() - t))).then(async () => {
        showFound = true

        // Give them a couple seconds to see the loading screen
        await sleep(2500)

        router.at("notes").push()
      })
    }
  }

  onMount(() => {
    sleep(8000).then(() => {
      failed = true
    })
  })
</script>

<Content size="lg">
  {#if showFound}
    <p class="text-center text-2xl">Success! Logging you in...</p>
  {:else if failed && !found}
    <p class="text-2xl">We're having a hard time finding your profile.</p>
  {:else}
    <p class="text-2xl">We're searching for your profile on the network.</p>
    <p>
      If you'd like to select your relays manually instead, click <Button
        class="text-inherit cursor-pointer bg-transparent p-0 underline"
        on:click={() => openModal("custom_relay")}>here</Button
      >.
    </p>
  {/if}
  {#if !showFound}
    <p>
      You can also <Button
        class="text-inherit cursor-pointer bg-transparent p-0 underline"
        on:click={skip}>skip this step</Button
      >, but be aware that your profile and relays may not get properly synchronized.
    </p>
  {/if}
  {#if failed && !found}
    <div class="flex justify-between gap-2">
      <Button class="btn" on:click={tryDefaultRelays}>Try again</Button>
      <Button class="btn btn-accent" on:click={() => openModal("custom_relay")}
        >Select relays manually</Button>
    </div>
  {/if}
  <Spinner />
</Content>

{#if !showFound && modal === "custom_relay"}
  <Modal>
    <Content size="lg">
      <Subheading>Use a custom relay</Subheading>
      <p>If you know which relay your profile is on, you can enter it below.</p>
      <Field label="Relay">
        <Input bind:value={customRelay} />
      </Field>
      <div class="flex justify-between gap-2">
        <Button class="btn" on:click={closeModal}>Cancel</Button>
        <Button class="btn btn-accent" on:click={confirmCustomRelay}>Search relay</Button>
      </div>
    </Content>
  </Modal>
{/if}
