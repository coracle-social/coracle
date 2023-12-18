<script lang="ts">
  import {tweened} from "svelte/motion"
  import {numberFmt} from "src/util/misc"
  import {router} from "src/app/router"
  import {people, getFollowers} from "src/engine"

  export let pubkey

  const followsCount = people.key(pubkey).derived($p => $p?.petnames?.length || 0)
  const interpolate = (a, b) => t => a + Math.round((b - a) * t)

  const followersCount = tweened(0, {interpolate, duration: 1000})

  const showFollows = () => router.at("people").of(pubkey).at("follows").open()

  const showFollowers = () => router.at("people").of(pubkey).at("followers").open()

  followersCount.set(getFollowers(pubkey).length)
</script>

<div class="flex gap-8">
  <button on:click={showFollows}>
    <strong>{$followsCount}</strong> following
  </button>
  <button on:click={showFollowers} class="hidden xs:block">
    <strong>{numberFmt.format($followersCount)}+</strong> followers
  </button>
</div>
