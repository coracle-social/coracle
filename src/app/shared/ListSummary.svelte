<script lang="ts">
  import {identity} from "ramda"
  import {quantify} from "hurdak/lib/hurdak"
  import {Tags} from "src/util/nostr"

  export let list

  const tags = Tags.from(list)
  const topics = tags.type("t").all()
  const authors = tags.type("p").all()
  const relays = tags.type("r").all()

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
