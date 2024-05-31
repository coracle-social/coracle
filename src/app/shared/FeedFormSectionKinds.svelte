<script lang="ts">
  import {
    NOTE,
    PROFILE,
    REACTION,
    LIVE_CHAT_MESSAGE,
    REMIX,
    AUDIO,
    REPORT,
    LABEL,
    REVIEW,
    HIGHLIGHT,
    LONG_FORM,
    LIVE_EVENT,
    STATUS,
    CLASSIFIED,
    EVENT_DATE,
    EVENT_TIME,
    EVENT_RSVP,
    HANDLER_RECOMMENDATION,
    HANDLER_INFORMATION,
    COMMUNITY,
    GROUP,
    FILE_METADATA,
    RELAYS,
  } from "@welshman/util"
  import {FeedType} from "@welshman/feeds"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {KindSearch} from "src/domain"

  export let feed
  export let onChange

  const onKindsChange = kinds => onChange([FeedType.Kind, ...kinds])

  const helper = new KindSearch([
    {label: "Note", kind: NOTE},
    {label: "Profile", kind: PROFILE},
    {label: "Reaction", kind: REACTION},
    {label: "Live chat", kind: LIVE_CHAT_MESSAGE},
    {label: "Remix", kind: REMIX},
    {label: "Audio", kind: AUDIO},
    {label: "Report", kind: REPORT},
    {label: "Label", kind: LABEL},
    {label: "Review", kind: REVIEW},
    {label: "Highlight", kind: HIGHLIGHT},
    {label: "Long form article", kind: LONG_FORM},
    {label: "Live event", kind: LIVE_EVENT},
    {label: "Status", kind: STATUS},
    {label: "Classified Listing", kind: CLASSIFIED},
    {label: "Calendar event (date based)", kind: EVENT_DATE},
    {label: "Calendar event (time based)", kind: EVENT_TIME},
    {label: "Calendar event RSVP", kind: EVENT_RSVP},
    {label: "Handler recommendation", kind: HANDLER_RECOMMENDATION},
    {label: "Handler information", kind: HANDLER_INFORMATION},
    {label: "Community definition", kind: COMMUNITY},
    {label: "Group definition", kind: GROUP},
    {label: "Image", kind: FILE_METADATA},
    {label: "Relay selections", kind: RELAYS},
  ])

  console.log(helper)
</script>

<span class="staatliches text-lg">What kind of content do you want to see?</span>
<SearchSelect multiple search={helper.searchValues} value={feed.slice(1)} onChange={onKindsChange}>
  <div slot="item" let:item>{helper.displayValue(item)}</div>
</SearchSelect>
