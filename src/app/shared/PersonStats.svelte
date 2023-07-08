<script lang="ts">
  import {onMount} from "svelte"
  import {fly} from "src/util/transition"
  import {tweened} from "svelte/motion"
  import {numberFmt} from "src/util/misc"
  import {modal} from "src/partials/state"
  import {watch} from "src/util/loki"
  import {social, routing, network} from "src/system"
  import legacyNetwork from "src/agent/network"

  export let pubkey

  const followsCount = watch(social.graph, () => social.getFollowsSet(pubkey).size)
  const interpolate = (a, b) => t => a + Math.round((b - a) * t)

  let followersCount = tweened(0, {interpolate, duration: 1000})

  const showFollows = () => {
    modal.push({type: "person/follows", pubkey})
  }

  const showFollowers = () => {
    modal.push({type: "person/followers", pubkey})
  }

  onMount(async () => {
    // Get our followers count
    const count = await network.count({kinds: [3], "#p": [pubkey]})

    if (count) {
      followersCount.set(count)
    } else {
      const followers = new Set()

      await legacyNetwork.load({
        relays: routing.getUserHints(3, "read"),
        shouldProcess: false,
        filter: [{kinds: [3], "#p": [pubkey]}],
        onChunk: events => {
          for (const e of events) {
            followers.add(e.pubkey)
          }

          followersCount.set(followers.size)
        },
      })
    }
  })
</script>

<div class="flex gap-8" in:fly={{y: 20}}>
  <button on:click={showFollows}>
    <strong>{$followsCount}</strong> following
  </button>
  <button on:click={showFollowers}>
    <strong>{numberFmt.format($followersCount)}</strong> followers
  </button>
</div>
