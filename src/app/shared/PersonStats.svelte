<script lang="ts">
  import {batch} from "hurdak"
  import {onDestroy} from "svelte"
  import {tweened} from "svelte/motion"
  import {numberFmt} from "src/util/misc"
  import {modal} from "src/partials/state"
  import type {Event} from "src/engine"
  import {session, people, count, subscribe, getPubkeyHints} from "src/engine"

  export let pubkey

  const followsCount = people.key(pubkey).derived($p => $p?.petnames?.length || 0)
  const interpolate = (a, b) => t => a + Math.round((b - a) * t)

  let sub
  let canLoadFollowers = true
  let followersCount = tweened(0, {interpolate, duration: 1000})

  const showFollows = () => modal.push({type: "person/follows", pubkey})

  const showFollowers = () => modal.push({type: "person/followers", pubkey})

  const loadFollowers = async () => {
    canLoadFollowers = false

    // Get our followers count
    const total = await count([{kinds: [3], "#p": [pubkey]}])

    if (total) {
      followersCount.set(total)
    } else {
      const followers = new Set()

      sub = subscribe({
        shouldProject: false,
        relays: getPubkeyHints.limit(3).getHints($session?.pubkey, "read"),
        filters: [{kinds: [3], "#p": [pubkey]}],
        onEvent: batch(300, (events: Event[]) => {
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

<div class="flex gap-8">
  <button on:click={showFollows}>
    <strong>{$followsCount}</strong> following
  </button>
  <button on:click={showFollowers} class="hidden xs:block">
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
