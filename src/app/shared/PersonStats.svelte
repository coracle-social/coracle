<script lang="ts">
  import {tweened} from "svelte/motion"
  import {FollowLists, WotScope} from "@welshman/app"
  import {fromApp, wot} from "src/engine/core"
  import {numberFmt} from "src/util/misc"
  import {router} from "src/app/util/router"

  export let pubkey

  const interpolate = (a, b) => t => a + Math.round((b - a) * t)
  const followsCount = tweened(0, {interpolate, duration: 1000})
  const followersCount = tweened(0, {interpolate, duration: 1300})
  const followList = fromApp($app => $app.use(FollowLists).one(pubkey))

  const showFollows = () => router.at("people").of(pubkey).at("follows").open()

  const showFollowers = () => router.at("people").of(pubkey).at("followers").open()

  // The count everyone can see, not the count the user's own follows account for — this is a
  // raw follower total, so it reads the whole graph rather than the user's slice of it.
  followersCount.set(wot.get().followers(pubkey, WotScope.Global).get().length)

  $: pubkeys = $followList?.pubkeys() || []

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
