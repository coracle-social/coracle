<script lang="ts">
  import {batch} from "hurdak"
  import {onDestroy} from "svelte"
  import {fly} from "src/util/transition"
  import {tweened} from "svelte/motion"
  import {numberFmt} from "src/util/misc"
  import {modal} from "src/partials/state"
  import {Nip02, User, Nip65, Network} from "src/app/engine"

  export let pubkey

  const followsCount = Nip02.graph.key(pubkey).derived(() => Nip02.getFollowsSet(pubkey).size)
  const interpolate = (a, b) => t => a + Math.round((b - a) * t)

  let sub
  let canLoadFollowers = true
  let followersCount = tweened(0, {interpolate, duration: 1000})

  const showFollows = () => modal.push({type: "person/follows", pubkey})

  const showFollowers = () => modal.push({type: "person/followers", pubkey})

  const loadFollowers = async () => {
    canLoadFollowers = false

    // Get our followers count
    const count = await Network.count({kinds: [3], "#p": [pubkey]})

    if (count) {
      followersCount.set(count)
    } else {
      const followers = new Set()

      sub = Network.subscribe({
        timeout: 30_000,
        shouldProcess: false,
        relays: Nip65.getPubkeyHints(3, User.getPubkey(), "read"),
        filter: [{kinds: [3], "#p": [pubkey]}],
        onEvent: batch(300, events => {
          for (const e of events) {
            followers.add(e.pubkey)
          }

          followersCount.set(followers.size)
        }),
      })
    }
  }

  onDestroy(() => {
    sub?.close()
  })
</script>

<div class="flex gap-8" in:fly={{y: 20}}>
  <button on:click={showFollows}>
    <strong>{$followsCount}</strong> following
  </button>
  <button on:click={showFollowers}>
    <strong>
      {#if canLoadFollowers}
        <i class="fa fa-download mr-1" on:click|stopPropagation={loadFollowers} />
      {:else if $followersCount === 0}
        <i class="fa fa-circle-notch fa-spin mr-1" />
      {:else}
        {numberFmt.format($followersCount)}
      {/if}
    </strong>
    followers
  </button>
</div>
