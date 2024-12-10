<script lang="ts">
  import {formatTimestamp} from "@welshman/app"
  import {messageAndColorFromStatus, type PublishNotice} from "src/domain/connection"

  export let notice: PublishNotice

  const {color} = messageAndColorFromStatus(notice.status)
</script>

<div class="flex gap-2 p-2">
  <span class="shrink-0 text-neutral-400">{formatTimestamp(notice.created_at)}</span>
  <strong class={color}>to {notice.url}:</strong>
  <span class="shrink-0">[Kind {notice.eventKind}]</span>
  <span class="">{notice.message}</span>
</div>
