<script lang="ts">
  import {onMount} from "svelte"
  import {fly} from "src/util/transition"
  import {tweened} from "svelte/motion"
  import {numberFmt, batch} from "src/util/misc"
  import {modal} from "src/partials/state"
  import {social, user, nip65, network} from "src/app/engine"

  export let pubkey

  const followsCount = social.graph.key(pubkey).derived(() => social.getFollowsSet(pubkey).size)
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

      await network.load({
        relays: nip65.getPubkeyHints(3, user.getPubkey(), "read"),
        shouldProcess: false,
        filter: [{kinds: [3], "#p": [pubkey]}],
        onEvent: batch(300, events => {
          for (const e of events) {
            followers.add(e.pubkey)
          }

          followersCount.set(followers.size)
        }),
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
