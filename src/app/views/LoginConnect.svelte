<script lang="ts">
  import {sleep} from "hurdak"
  import {normalizeRelayUrl, isShareableRelayUrl} from "@coracle.social/util"
  import {userKinds, LOCAL_RELAY_URL} from "src/util/nostr"
  import {toast} from "src/partials/state"
  import Modal from "src/partials/Modal.svelte"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/util/router"
  import {loadUserData} from "src/app/state"
  import {env, loadPubkeys, session} from "src/engine"

  const t = Date.now()

  const skip = () => router.at("notes").push()

  const searchRelays = async relays => {
    failed = false

    await loadPubkeys([$session.pubkey], {force: true, kinds: userKinds})

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
      toast.show("warning", "Please enter a valid relay url")
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
    if (!found && $session.kind0 && ($session.kind3 || $session.kind10002)) {
      found = true

      // Reload everything, it's possible we didn't get their petnames if we got a match
      // from something like purplepag.es. This helps us avoid nuking follow lists later
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
    <p class="text-2xl text-center">Success! Logging you in...</p>
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
    <div class="flex justify-end gap-2">
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
      <div class="flex justify-center gap-2">
        <Anchor button on:click={closeModal}>Cancel</Anchor>
        <Anchor button accent on:click={confirmCustomRelay}>Search relay</Anchor>
      </div>
    </Content>
  </Modal>
{/if}
