<script lang="ts">
  import Fuse from "fuse.js"
  import {identity, memoizeWith, sortBy, map} from "ramda"
  import {tryFunc} from "hurdak"
  import {fromNostrURI} from "paravel"
  import {throttle} from "throttle-debounce"
  import {nip05, nip19} from "nostr-tools"
  import {isHex} from "src/util/nostr"
  import {router} from "src/app/router"
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

  export let term
  export let replace = false

  const openTopic = topic => router.at("topics").of(topic).open({replace})

  const openPerson = pubkey => router.at("people").of(pubkey).open({replace})

  const onClick = result => {
    if (result.type === "topic") {
      openTopic(result.topic.name)
    }

    if (result.type === "profile") {
      openPerson(result.id)
    }
  }

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
          extraText: profile?.about || "",
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
        keys: ["text", {name: "extraText", weight: 0.2}],
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


  const tryParseEntity = throttle(
    500,
    async entity => {
      entity = fromNostrURI(entity)

      if (entity.length < 5) {
        return
      }

      if (isHex(entity)) {
        router.at("people").of(entity).replaceModal()
      } else if (entity.includes("@")) {
        const profile = await nip05.queryProfile(entity)

        if (profile) {
          const {pubkey, relays} = profile

          router.at("people").of(pubkey, {relays}).replaceModal()
        }
      } else {
        tryFunc(() => {
          nip19.decode(entity)
          router.at(entity).replaceModal()
        })
      }
    },
    {
      noTrailing: true,
    },
  )

  let results = []

  primeWotCaches($pubkey)

  $: {
    if (term && !term.startsWith("#")) {
      loadPeople(term)
    }

    if (term?.length > 30) {
      tryParseEntity(term)
    }

    populateResults(term)
  }
</script>

{#each results as result (result.type + result.id)}
  <div on:click={() => onClick(result)}>
    <slot name="result" {result} />
  </div>
{:else}
  <p class="text-center py-12">No results found.</p>
{/each}
