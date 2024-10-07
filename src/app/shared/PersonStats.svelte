<script lang="ts">
  import {tweened} from "svelte/motion"
  import {getListTags, getPubkeyTagValues} from "@welshman/util"
  import {deriveFollows, getFollowers} from "@welshman/app"
  import {numberFmt} from "src/util/misc"
  import {router} from "src/app/util/router"

  export let pubkey

  const interpolate = (a, b) => t => a + Math.round((b - a) * t)
  const followsCount = tweened(0, {interpolate, duration: 1000})
  const followersCount = tweened(0, {interpolate, duration: 1300})
  const follows = deriveFollows(pubkey)

  const showFollows = () => router.at("people").of(pubkey).at("follows").open()

  const showFollowers = () => router.at("people").of(pubkey).at("followers").open()

  followersCount.set(getFollowers(pubkey).length)

  $: pubkeys = getPubkeyTagValues(getListTags($follows))

  $: {
    followsCount.set(pubkeys.length)
  }
</script>

<div class="flex gap-8">
  <button on:click={showFollows}>
    <strong>{$followsCount}</strong> following
  </button>
  <button on:click={showFollowers} class="hidden xs:block">
    <strong>{numberFmt.format($followersCount)}+</strong> followers
  </button>
</div>
