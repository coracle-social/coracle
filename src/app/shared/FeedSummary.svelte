<script lang="ts">
  import {quantify} from "hurdak/lib/hurdak"

  export let feed
</script>

<p>
  {feed.topics ? quantify(feed.topics.length, "topic") : ""}
  {feed.authors ? quantify(feed.authors.length, "author") : ""}
  {feed.relays ? quantify(feed.relays.length, "relay") : ""}
</p>
