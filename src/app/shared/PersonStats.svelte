<script lang="ts">
  import {tweened} from "svelte/motion"
  import {numberFmt} from "src/util/misc"
  import {router} from "src/app/util/router"
  import {getFollows, getFollowers} from "src/engine"

  export let pubkey

  const interpolate = (a, b) => t => a + Math.round((b - a) * t)
  const followsCount = tweened(0, {interpolate, duration: 1000})
  const followersCount = tweened(0, {interpolate, duration: 1300})

  const showFollows = () => router.at("people").of(pubkey).at("follows").open()

  const showFollowers = () => router.at("people").of(pubkey).at("followers").open()

  followsCount.set(getFollows(pubkey).size)
  followersCount.set(getFollowers(pubkey).size)
</script>

<div class="flex gap-8">
  <button on:click={showFollows}>
    <strong>{$followsCount}</strong> following
  </button>
  <button on:click={showFollowers} class="hidden xs:block">
    <strong>{numberFmt.format($followersCount)}+</strong> followers
  </button>
</div>
