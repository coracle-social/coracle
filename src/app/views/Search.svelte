<script lang="ts">
  import Fuse from "fuse.js"
  import {identity, memoizeWith, sortBy, map} from "ramda"
  import {tryFunc} from "hurdak"
  import {onDestroy} from "svelte"
  import {fromNostrURI} from "paravel"
  import {throttle} from "throttle-debounce"
  import {nip05, nip19} from "nostr-tools"
  import QrScanner from "qr-scanner"
  import Card from "src/partials/Card.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import {isHex} from "src/util/nostr"
  import Input from "src/partials/Input.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import {router} from "src/app/router"
  import {searchTerm} from "src/app/state"
  import type {Topic} from "src/engine"
  import {
    pubkey,
    topics,
    peopleWithName,
    primeWotCaches,
    getWotScore,
    loadPeople,
    session,
  } from "src/engine"

  const onClose = () => router.pop()

  const openTopic = topic => router.at("topic").of(topic).replaceModal()

  const openPerson = pubkey => router.at("people").of(pubkey).replaceModal()

  const topicOptions = topics.derived(
    map((topic: Topic) => ({type: "topic", id: topic.name, topic, text: "#" + topic.name})),
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
          text: [profile?.name, profile?.display_name, handle?.address].filter(identity).join(" "),
        }
      }),
  )

  const sortByWotAndScore = sortBy(({score, item}: any) => {
    if (item.type === "profile") {
      return (score - 1) * Math.sqrt(getWotScore($pubkey, item.person.pubkey))
    }

    return -score
  })

  const getFuse = memoizeWith(
    s => String(s?.[0] === "#"),
    s => {
      const options = s?.[0] === "#" ? $topicOptions : $profileOptions

      return new Fuse(options as any, {
        keys: ["text"],
        threshold: 0.5,
        shouldSort: false,
        includeScore: true,
      })
    },
  )

  const search = s => {
    if (!s) {
      return sortBy(r => -getWotScore($pubkey, r.person.pubkey), $profileOptions) as any[]
    }

    const fuse = getFuse(s)
    const results = fuse.search(s)
    const sorted = sortByWotAndScore(results)

    return sorted.map(r => r.item) as any[]
  }

  const populateResults = throttle(300, s => {
    results = search(s).slice(0, 30)
  })

  const startScanner = () => {
    scanner = new Promise(resolve => {
      setTimeout(async () => {
        const scanner = new QrScanner(video, r => tryParseEntity(r.data), {
          returnDetailedScanResult: true,
        })

        await scanner.start()

        resolve(scanner)
      }, 1000)
    })
  }

  const stopScanner = () => {
    scanner?.then(async s => {
      await s.stop()
      await s.destroy()
    })

    scanner = null
  }

  const tryParseEntity = throttle(
    500,
    async entity => {
      entity = fromNostrURI(entity)

      if (entity.length < 5) {
        return
      }

      if (isHex(entity)) {
        router.at("people").of(entity).replaceModal()
        stopScanner()
      } else if (entity.includes("@")) {
        let profile = await nip05.queryProfile(entity)

        if (profile) {
          const {pubkey, relays} = profile

          router.at("people").of(pubkey, {relays}).replaceModal()
          stopScanner()
        }
      } else {
        tryFunc(() => {
          nip19.decode(entity)
          router.at(entity).replaceModal()
          stopScanner()
        })
      }
    },
    {
      noTrailing: true,
    },
  )

  let results = []
  let video, scanner
  let innerWidth = 0

  primeWotCaches($pubkey)

  onDestroy(() => {
    stopScanner()
    searchTerm.set(null)
  })

  $: {
    if ($searchTerm && !$searchTerm.startsWith("#")) {
      loadPeople($searchTerm)
    }

    if ($searchTerm?.length > 30) {
      tryParseEntity($searchTerm)
    }

    populateResults($searchTerm)
  }
</script>

<svelte:window bind:innerWidth />

{#if scanner}
  {#await scanner}
    <Spinner>Loading your camera...</Spinner>
  {:then}
    <span />
  {/await}
  <div
    class="m-auto rounded border border-solid border-mid bg-dark p-4"
    class:hidden={status !== "ready"}>
    <video class="m-auto rounded" bind:this={video} />
  </div>
{:else}
  {#each results as result (result.type + result.id)}
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
{/if}
{#if innerWidth < 1024}
  <div
    class="fixed bottom-0 left-0 right-0 flex items-center gap-3 border-t border-solid border-mid bg-dark px-3 py-2">
    <div class="flex-grow">
      <Input autofocus bind:value={$searchTerm}>
        <i slot="before" class="fa fa-search" />
        <i slot="after" class="fa fa-qrcode cursor-pointer" on:click={startScanner} />
      </Input>
    </div>
    <i class="fa fa-times fa-2xl cursor-pointer" on:click={onClose} />
  </div>
{/if}
