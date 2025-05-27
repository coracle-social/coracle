<script lang="ts">
  import {channelsById, makeChannelId} from "@app/state"

  const {url, room} = $props()
</script>

{$channelsById.get(makeChannelId(url, room))?.name || room}
