<script lang="ts">
  import {without} from 'ramda'
  import {decodeAddress, isGroupAddress} from '@coracle.social/util'
  import {noteKinds} from 'src/util/nostr'
  import Calendar from "src/app/shared/Calendar.svelte"
  import NoteCreateInline from "src/app/shared/NoteCreateInline.svelte"
  import {canSign} from "src/engine"

  export let address
</script>

<Calendar group={address} filters={[{kinds: [31923], "#a": [address]}]} />
