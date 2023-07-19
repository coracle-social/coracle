<script lang="ts">
  import {identity} from "ramda"
  import {quantify} from "hurdak"
  import {Tags} from "src/util/nostr"

  export let list

  const topics = Tags.from(list).topics()
  const authors = Tags.from(list).pubkeys()
  const relays = Tags.from(list).urls()

  const summary = [
    topics.length > 0 && quantify(topics.length, "topic"),
    authors.length > 0 && quantify(authors.length, "author"),
  ]
    .filter(identity)
    .join(", ")
</script>

<p>
  {summary}
  {relays.length > 0 ? `on ${quantify(relays.length, "relay")}` : ""}
</p>
