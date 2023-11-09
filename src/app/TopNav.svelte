<script lang="ts">
  import cx from "classnames"
  import {identity, map} from "ramda"
  import {tryFunc} from "hurdak"
  import {fromNostrURI} from "paravel"
  import {throttle} from "throttle-debounce"
  import {nip05, nip19} from "nostr-tools"
  import {onMount} from "svelte"
  import {fuzzy} from "src/util/misc"
  import {isHex} from "src/util/nostr"
  import {appName} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Content from "src/partials/Content.svelte"
  import Scan from "src/app/shared/Scan.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import TopNavMenu from "src/app/TopNavMenu.svelte"
  import {menuIsOpen} from "src/app/state"
  import {router} from "src/app/router"
  import type {Topic} from "src/engine"
  import {
    topics,
    peopleWithName,
    session,
    canUseGiftWrap,
    hasNewNip04Messages,
    hasNewNip24Messages,
    hasNewNotifications,
    loadPeople,
  } from "src/engine"

  //const logoUrl = import.meta.env.VITE_LOGO_URL || "/images/logo.png"

  const toggleMenu = () => menuIsOpen.update(x => !x)

  $: hasNewDMs = $hasNewNip04Messages || ($canUseGiftWrap && $hasNewNip24Messages)

  let term = ""
  let searchIsOpen = false
  let options = []
  let scanner
  let searchInput

  const showLogin = () => router.at("login/intro").open()

  const showSearch = () => {
    searchIsOpen = true
    searchInput.focus()
  }

  const hideSearch = () => {
    term = ""
    searchIsOpen = false
    scanner?.stop()
  }

  const showScan = () => {
    hideSearch()
    scanner.start()
  }

  const openTopic = topic => {
    hideSearch()
    router.at("topic").of(topic).open()
  }

  const openPerson = pubkey => {
    hideSearch()
    router.at("people").of(pubkey).open()
  }

  const tryParseEntity = throttle(
    500,
    async entity => {
      entity = fromNostrURI(entity)

      if (entity.length < 5) {
        return
      }

      if (isHex(entity)) {
        router.at("people").of(entity).open()
        hideSearch()
      } else if (entity.includes("@")) {
        let profile = await nip05.queryProfile(entity)

        if (profile) {
          const {pubkey, relays} = profile

          router.at("people").of(pubkey, {relays}).open()
          hideSearch()
        }
      } else {
        tryFunc(() => {
          nip19.decode(entity)
          router.at(entity).open()
          hideSearch()
        })
      }
    },
    {
      noTrailing: true,
    }
  )

  const topicOptions = topics.derived(
    map((topic: Topic) => ({type: "topic", id: topic.name, topic, text: "#" + topic.name}))
  )

  const profileOptions = peopleWithName.derived($people =>
    $people
      .filter(person => person.pubkey !== $session?.pubkey)
      .map(person => {
        const {pubkey, profile, handle} = person

        return {
          person,
          id: pubkey,
          type: "profile",
          text:
            "@" +
            [profile?.name, profile?.display_name, handle?.address].filter(identity).join(" "),
        }
      })
  )

  $: {
    if (term) {
      loadPeople(term)
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

  $: search = fuzzy(options, {keys: ["text"], threshold: 0.5})

  onMount(() => {
    document.querySelector("html").addEventListener("click", e => {
      if (!(e.target as any).closest(".app-logo")) {
        menuIsOpen.set(false)
      }

      if (!(e.target as any).closest(".search-input")) {
        searchIsOpen = false
      }
    })
  })
</script>

<svelte:body
  on:keydown={e => {
    if (e.key === "Escape" && searchIsOpen) {
      hideSearch()
    }
  }} />

<div
  class="cy-top-nav fixed top-0 z-10 flex h-16 w-full items-center justify-between
            border-b border-gray-6 bg-gray-7 px-2 text-gray-2">
  <div>
    <div class="app-logo flex cursor-pointer items-center gap-2" on:click={toggleMenu}>
      <!-- <img alt="App Logo" src={logoUrl} class="w-10" /> -->
      <img
        alt="Happy Harvest!"
        src="/images/pumpkin.png"
        class="w-10"
        title="png image from pngtree.com" />
      <h1 class="staatliches pt-1 text-3xl">{appName}</h1>
      {#if $hasNewNotifications || hasNewDMs}
        <div
          class="absolute left-8 top-4 h-2 w-2 rounded border border-solid border-white bg-accent" />
      {/if}
    </div>
  </div>
  {#if $session}
    <TopNavMenu />
  {:else}
    <Anchor theme="button-accent" on:click={showLogin}>Log In</Anchor>
  {/if}
</div>

<div
  class={cx(
    "search-input pointer-events-none fixed top-0 z-10 w-full px-2 text-gray-1",
    "cy-top-nav flex h-16 items-center justify-end gap-4",
    {
      "pr-16": $session,
      "pr-28": !$session,
      "z-40 pr-0": term,
    }
  )}>
  <div
    class="pointer-events-auto relative z-10 cursor-pointer p-2"
    class:text-black={searchIsOpen}
    class:-mr-2={searchIsOpen}
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
        "-mr-6 w-0 opacity-0": !searchIsOpen,
        "opacity-1 -ml-12 w-full pl-10 sm:-mr-1 sm:w-64": searchIsOpen,
      }
    )} />
  <div
    class="pointer-events-auto cursor-pointer p-2 sm:block"
    class:hidden={searchIsOpen}
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
