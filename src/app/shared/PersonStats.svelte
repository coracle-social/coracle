<script lang="ts">
  import {onDestroy} from "svelte"
  import {tweened} from "svelte/motion"
  import {numberFmt} from "src/util/misc"
  import {modal} from "src/partials/state"
  import {people, getFollowers} from "src/engine"

  export let pubkey

  const followsCount = people.key(pubkey).derived($p => $p?.petnames?.length || 0)
  const interpolate = (a, b) => t => a + Math.round((b - a) * t)

  let sub
  let followersCount = tweened(0, {interpolate, duration: 1000})

  const showFollows = () => modal.push({type: "person/follows", pubkey})

  const showFollowers = () => modal.push({type: "person/followers", pubkey})

  followersCount.set(getFollowers(pubkey).length)

  onDestroy(() => {
    sub?.close()
  })
</script>

<div class="flex gap-8">
  <button on:click={showFollows}>
    <strong>{$followsCount}</strong> following
  </button>
  <button on:click={showFollowers} class="hidden xs:block">
    <strong>{numberFmt.format($followersCount)}+</strong> followers
  </button>
</div>
