<script lang="ts">
  import {FeedType} from "@welshman/feeds"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {KindSearch} from "src/domain"

  export let feed
  export let onChange

  const onKindsChange = kinds => onChange([FeedType.Kind, ...kinds])

  const helper = new KindSearch([
    {label: "Note", kind: 1},
    {label: "Profile", kind: 0},
    {label: "Reaction", kind: 7},
    {label: "Live chat", kind: 1311},
    {label: "Remix", kind: 1808},
    {label: "Audio", kind: 31337},
    {label: "Report", kind: 1984},
    {label: "Label", kind: 1985},
    {label: "Review", kind: 1986},
    {label: "Highlight", kind: 9802},
    {label: "Article", kind: 30023},
    {label: "Live event", kind: 30311},
    {label: "Status", kind: 30315},
    {label: "Listing", kind: 30402},
    {label: "Calendar event (date based)", kind: 31922},
    {label: "Calendar event (time based)", kind: 31923},
    {label: "Calendar event RSVP", kind: 31925},
    {label: "Handler recommendation", kind: 31989},
    {label: "Handler information", kind: 31990},
    {label: "Community definition", kind: 34550},
    {label: "Group definition", kind: 35834},
    {label: "Image", kind: 1063},
    {label: "Relay selections", kind: 10002},
  ])
</script>

<span class="staatliches text-lg">What kind of content do you want to see?</span>
<SearchSelect multiple search={helper.search} value={feed.slice(1)} onChange={onKindsChange}>
  <div slot="item" let:item>{helper.display(item)}</div>
</SearchSelect>
