<script lang="ts">
  import {sleep} from "hurdak"
  import {
    RELAYS,
    FOLLOWS,
    PROFILE,
    LOCAL_RELAY_URL,
    normalizeRelayUrl,
    isShareableRelayUrl,
  } from "@welshman/util"
  import {showWarning} from "src/partials/Toast.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/util/router"
  import {loadUserData} from "src/app/state"
  import {env, loadPubkeyUserData, deriveEvents, session} from "src/engine"

  const t = Date.now()

  const events = deriveEvents({
    filters: [{kinds: [RELAYS, FOLLOWS, PROFILE], authors: [$session.pubkey]}],
  })

  const skip = () => router.at("notes").push()

  const searchRelays = async relays => {
    failed = false

    loadPubkeyUserData([$session.pubkey], {relays})

    await sleep(3000)

    if (!found) {
      failed = true
    }
  }

  const confirmCustomRelay = () => {
    const url = normalizeRelayUrl(customRelay)

    if (isShareableRelayUrl(url)) {
      searchRelays([url])
      customRelay = ""
      closeModal()
    } else {
      showWarning("Please enter a valid relay url")
    }
  }

  const tryDefaultRelays = () => {
    // Pull out all the stops to try to find the user's profile
    searchRelays([LOCAL_RELAY_URL, ...env.get().DEFAULT_RELAYS, ...env.get().PLATFORM_RELAYS])
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
</script>

<Content size="lg">
  {#if showFound}
    <p class="text-center text-2xl">Success! Logging you in...</p>
  {:else if failed}
    <p class="text-2xl">We're having a hard time finding your profile.</p>
  {:else}
    <p class="text-2xl">We're searching for your profile on the network.</p>
    <p>
      If you'd like to select your relays manually instead, click <Anchor
        underline
        on:click={() => openModal("custom_relay")}>here</Anchor
      >.
    </p>
  {/if}
  {#if !showFound}
    <p>
      You can also <Anchor underline on:click={skip}>skip this step</Anchor>, but be aware that your
      profile and relays may not get properly synchronized.
    </p>
  {/if}
  {#if failed}
    <div class="flex justify-between gap-2">
      <Anchor button on:click={tryDefaultRelays}>Try again</Anchor>
      <Anchor button accent on:click={() => openModal("custom_relay")}
        >Select relays manually</Anchor>
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
        <Anchor button on:click={closeModal}>Cancel</Anchor>
        <Anchor button accent on:click={confirmCustomRelay}>Search relay</Anchor>
      </div>
    </Content>
  </Modal>
{/if}
