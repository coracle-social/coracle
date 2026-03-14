<script lang="ts">
  import {_} from "svelte-i18n"
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
  import {detectUPlanetServices} from "src/util/uplanet-detect"
  import {env, myLoad} from "src/engine"
  import {loadUserData} from "src/app/state"

  const uplanet = detectUPlanetServices()

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
      showWarning($_("login.invalidRelayUrl"))
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
    <p class="text-center text-2xl">{$_("login.connectSuccess")}</p>
  {:else if failed && !found}
    <p class="text-2xl">{$_("login.connectFailed")}</p>
  {:else}
    <p class="text-2xl">{$_("login.connectSearching")}</p>
    {#if uplanet}
      <p class="text-sm text-neutral-400">
        {$_("login.uplanetDetected", {values: {relay: uplanet.relayUrl}})}
      </p>
    {/if}
    <p>
      {$_("login.selectRelaysHint")}
      <Button
        class="text-inherit cursor-pointer bg-transparent p-0 underline"
        on:click={() => openModal("custom_relay")}>{$_("common.here")}</Button
      >.
    </p>
  {/if}
  {#if !showFound}
    <p>
      {$_("login.youCanAlso")}
      <Button class="text-inherit cursor-pointer bg-transparent p-0 underline" on:click={skip}
        >{$_("login.skipThisStep")}</Button
      >{$_("login.skipWarning")}
    </p>
  {/if}
  {#if failed && !found}
    <div class="flex justify-between gap-2">
      <Button class="btn" on:click={tryDefaultRelays}>{$_("login.tryAgain")}</Button>
      <Button class="btn btn-accent" on:click={() => openModal("custom_relay")}
        >{$_("login.selectRelaysManually")}</Button>
    </div>
  {/if}
  <Spinner />
</Content>

{#if !showFound && modal === "custom_relay"}
  <Modal>
    <Content size="lg">
      <Subheading>{$_("login.customRelay")}</Subheading>
      <p>{$_("login.customRelayDescription")}</p>
      <Field label={$_("login.relay")}>
        <Input bind:value={customRelay} />
      </Field>
      <div class="flex justify-between gap-2">
        <Button class="btn" on:click={closeModal}>{$_("common.cancel")}</Button>
        <Button class="btn btn-accent" on:click={confirmCustomRelay}
          >{$_("login.searchRelay")}</Button>
      </div>
    </Content>
  </Modal>
{/if}
