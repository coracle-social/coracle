<script>
  import {shuffle} from "src/util/misc"
  import Feed from "src/app2/shared/Feed.svelte"
  import {getUserFollows} from "src/agent/social"
  import {sampleRelays, getAllPubkeyWriteRelays} from "src/agent/relays"

  const authors = shuffle(getUserFollows()).slice(0, 256)
  const relays = sampleRelays(getAllPubkeyWriteRelays(authors))

  // Separate notes and reactions into two queries since otherwise reactions dominate,
  // we never find their parents (or reactions are mostly to a few posts), and the feed sucks
  const filter = [
    {kinds: [1], authors},
    {kinds: [7], authors},
  ]
</script>

<Feed {relays} {filter} />
