<script lang="ts">
  import {identity} from "ramda"
  import {quantify} from "hurdak"
  import {Tags} from "@coracle.social/util"

  export let list

  const tags = Tags.fromEvent(list)
  const topics = tags.topics().valueOf()
  const authors = tags.values("p").valueOf()
  const relays = tags.values("r").valueOf()

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
