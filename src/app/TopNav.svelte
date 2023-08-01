<script lang="ts">
  import cx from "classnames"
  import {identity, map} from "ramda"
  import {tryFunc} from "hurdak"
  import {nip05, nip19} from "nostr-tools"
  import {navigate} from "svelte-routing"
  import {debounce} from "throttle-debounce"
  import {onMount} from "svelte"
  import {derived} from "svelte/store"
  import {fuzzy} from "src/util/misc"
  import {fromNostrURI, isHex} from "src/util/nostr"
  import {appName, modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Card from "src/partials/Card.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Content from "src/partials/Content.svelte"
  import Scan from "src/app/shared/Scan.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import {menuIsOpen, slowConnections} from "src/app/state"
  import engine, {Keys, Alerts, Directory, Env, Network, Nip65, user} from "src/app/engine"

  const {pubkey} = Keys
  const {hasNewNotfications} = Alerts
  const logoUrl = import.meta.env.VITE_LOGO_URL || "/images/logo.png"
  const toggleMenu = () => menuIsOpen.update(x => !x)
  const profile = derived([pubkey, Directory.profiles], () =>
    $pubkey ? Directory.getProfile($pubkey) : null
  )

  let term = null
  let options = []
  let scanner
  let searchInput

  const showSearch = () => {
    term = ""
    searchInput.focus()
  }

  const hideSearch = () => {
    term = null
  }

  const showScan = () => {
    hideSearch()
    scanner.start()
  }

  const openTopic = topic => {
    hideSearch()
    modal.push({type: "topic/feed", topic})
  }

  const openPerson = pubkey => {
    hideSearch()
    modal.push({type: "person/detail", pubkey})
  }

  const loadProfiles = debounce(500, search => {
    // If we have a query, search using nostr.band. If not, ask for random profiles.
    // This allows us to populate results even if search isn't supported by forced urls
    if (term.length > 2) {
      Network.subscribe({
        relays: Nip65.getSearchRelays(),
        filter: [{kinds: [0], search, limit: 10}],
        timeout: 3000,
      })
    } else if (Directory.profiles.get().length < 50) {
      Network.subscribe({
        relays: user.getRelayUrls("read"),
        filter: [{kinds: [0], limit: 50}],
        timeout: 3000,
      })
    }
  })

  const tryParseEntity = debounce(500, async entity => {
    entity = fromNostrURI(entity)

    if (entity.length < 5) {
      return
    }

    if (isHex(entity)) {
      navigate("/" + nip19.npubEncode(entity))
    } else if (entity.includes("@")) {
      let profile = await nip05.queryProfile(entity)

      if (profile) {
        navigate("/" + nip19.nprofileEncode(profile))
      }
    } else {
      tryFunc(() => {
        nip19.decode(entity)
        navigate("/" + entity)
      })
    }
  })

  const topicOptions = engine.Content.topics.derived(
    map(topic => ({type: "topic", id: topic.name, topic, text: "#" + topic.name}))
  )

  const profileOptions = Directory.profiles.derived(() =>
    Directory.getNamedProfiles()
      .filter(profile => profile.pubkey !== Keys.pubkey.get())
      .map(profile => {
        const {pubkey, name, nip05, display_name} = profile

        return {
          profile,
          id: pubkey,
          type: "profile",
          text: "@" + [name, nip05, display_name].filter(identity).join(" "),
        }
      })
  )

  $: {
    if (term) {
      loadProfiles(term)
      tryParseEntity(term)
    }
  }

  $: firstChar = term ? term.slice(0, 1) : null

  $: {
    if (firstChar === "@") {
      options = $profileOptions
    } else if (firstChar === "#") {
      options = $topicOptions
    } else {
      options = ($profileOptions as any).concat($topicOptions as any)
    }
  }

  $: search = fuzzy(options, {keys: ["text"], threshold: 0.3})

  onMount(() => {
    document.querySelector("html").addEventListener("click", e => {
      if (!(e.target as any).closest(".app-logo")) {
        menuIsOpen.set(false)
      }

      if (!(e.target as any).closest(".search-input")) {
        term = null
      }
    })
  })
</script>

<svelte:body
  on:keydown={e => {
    if (e.key === "Escape" && term !== null) {
      term = null
    }
  }} />

<div
  class="fixed top-0 z-10 flex h-16 w-full items-center justify-between border-b
            border-gray-6 bg-gray-7 px-2 text-gray-2">
  <div>
    <div class="app-logo flex cursor-pointer items-center gap-2" on:click={toggleMenu}>
      <img alt="App Logo" src={logoUrl} class="w-10" />
      <h1 class="staatliches pt-1 text-3xl">{appName}</h1>
    </div>
  </div>
  {#if $profile}
    <Popover theme="transparent" placement="top-end">
      <div slot="trigger" class="relative flex cursor-pointer items-center">
        <PersonCircle size={10} pubkey={$pubkey} />
        {#if $hasNewNotfications}
          <div class="absolute right-0 h-[9px] w-[9px] rounded bg-accent" />
        {/if}
      </div>
      <div slot="tooltip" class="flex justify-end">
        <Card class="mt-1 overflow-hidden shadow-lg">
          <div class="-mx-3 -mt-1">
            <Anchor
              class="relative block p-3 px-4 transition-all hover:bg-accent hover:text-white"
              href="/notifications">
              <i class="fa fa-bell mr-2" /> Notifications
              {#if $hasNewNotfications}
                <div class="absolute left-6 top-4 h-1 w-1 rounded bg-accent" />
              {/if}
            </Anchor>
            <Anchor
              class="block p-3 px-4 transition-all hover:bg-accent hover:text-white"
              href="/keys">
              <i class="fa fa-key mr-2" /> Keys
            </Anchor>
            {#if Env.FORCE_RELAYS.length === 0}
              <Anchor
                class="block p-3 px-4 transition-all hover:bg-accent hover:text-white"
                href="/relays">
                <i class="fa fa-server mr-2" /> Relays
                {#if $slowConnections.length > 0}
                  <div class="absolute left-8 top-2 h-2 w-2 rounded bg-accent" />
                {/if}
              </Anchor>
            {/if}
            <Anchor
              class="block p-3 px-4 transition-all hover:bg-accent hover:text-white"
              href="/settings">
              <i class="fa fa-gear mr-2" /> Settings
            </Anchor>
            <Anchor
              class="block p-3 px-4 transition-all hover:bg-accent hover:text-white"
              href="/logout">
              <i class="fa fa-right-from-bracket mr-2" /> Logout
            </Anchor>
          </div>
        </Card>
      </div>
    </Popover>
  {:else}
    <Anchor theme="button-primary" href="/login">Log In</Anchor>
  {/if}
</div>

<div
  class={cx(
    "search-input pointer-events-none fixed top-0 z-10 w-full px-2 text-white sm:pr-16",
    "flex h-16 items-center justify-end gap-4",
    {
      "pr-16": term === null,
      "z-40 pr-0": term,
    }
  )}>
  <div
    class="pointer-events-auto relative z-10 cursor-pointer p-2"
    class:text-black={term !== null}
    class:-mr-2={term !== null}
    on:click={showSearch}>
    <i class="fa fa-search" />
  </div>
  <input
    type="text"
    bind:value={term}
    bind:this={searchInput}
    on:change={() => searchInput.focus()}
    class={cx(
      "shadow-inset h-10 rounded-full border-gray-3 bg-input bg-input placeholder:text-gray-5",
      "pointer-events-auto cursor-pointer text-black transition-all",
      {
        "-mr-6 w-0 opacity-0": term === null,
        "opacity-1 -ml-12 sm:-mr-1 sm:w-64 w-full pl-10": term !== null,
      }
    )} />
  <div
    class="pointer-events-auto cursor-pointer p-2 sm:block"
    class:hidden={term !== null}
    on:click={showScan}>
    <i class="fa fa-qrcode" />
  </div>
</div>

{#if term}
  <Modal onEscape={hideSearch}>
    <Content>
      {#each search(term).slice(0, 50) as result (result.type + result.id)}
        {#if result.type === "topic"}
          <Card interactive on:click={() => openTopic(result.topic.name)}>
            #{result.topic.name}
          </Card>
        {:else if result.type === "profile"}
          <Card interactive on:click={() => openPerson(result.id)}>
            <PersonSummary inert hideActions pubkey={result.id} />
          </Card>
        {/if}
      {:else}
        <p class="text-center py-12">No results found.</p>
      {/each}
    </Content>
  </Modal>
{/if}

<Scan bind:this={scanner} onScan={tryParseEntity} />
