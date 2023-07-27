<script>
  import {debounce} from "throttle-debounce"
  import {navigate} from "svelte-routing"
  import {nip05, nip19} from "nostr-tools"
  import {identity, map} from "ramda"
  import {tryFunc} from "hurdak"
  import {fuzzy} from "src/util/misc"
  import {fromNostrURI, isHex} from "src/util/nostr"
  import {modal} from "src/partials/state"
  import Input from "src/partials/Input.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"
  import BorderLeft from "src/partials/BorderLeft.svelte"
  import Scan from "src/app/shared/Scan.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import {user, Keys, Directory, Network, Nip65, default as engine} from "src/app/engine"

  let q = ""
  let options = []
  let scanner

  const openTopic = topic => modal.push({type: "topic/feed", topic})

  const loadProfiles = debounce(500, search => {
    // If we have a query, search using nostr.band. If not, ask for random profiles.
    // This allows us to populate results even if search isn't supported by forced urls
    if (q.length > 2) {
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
    loadProfiles(q)
    tryParseEntity(q)
  }

  $: firstChar = q.slice(0, 1)

  $: {
    if (firstChar === "@") {
      options = $profileOptions
    } else if (firstChar === "#") {
      options = $topicOptions
    } else {
      options = $profileOptions.concat($topicOptions)
    }
  }

  $: search = fuzzy(options, {keys: ["text"], threshold: 0.3})

  document.title = "Search"
</script>

<Content>
  <div class="flex flex-col items-center justify-center">
    <Heading>Search</Heading>
    <p>
      Enter any nostr identifier or search term to find people and topics. You can also click on the
      camera icon to scan with your device's camera instead.
    </p>
  </div>
  <Input autofocus bind:value={q} placeholder="Search for people or topics">
    <i slot="before" class="fa-solid fa-search" />
    <i
      slot="after"
      class="fa-solid fa-camera cursor-pointer text-accent"
      on:click={() => scanner.start()} />
  </Input>

  {#each search(q).slice(0, 50) as result (result.type + result.id)}
    {#if result.type === "topic"}
      <BorderLeft on:click={() => openTopic(result.topic.name)}>
        #{result.topic.name}
      </BorderLeft>
    {:else if result.type === "profile"}
      <BorderLeft on:click={() => modal.push({type: "person/feed", pubkey: result.id})}>
        <PersonSummary hideActions pubkey={result.id} />
      </BorderLeft>
    {/if}
  {/each}
</Content>

<Scan bind:this={scanner} onScan={tryParseEntity} />
