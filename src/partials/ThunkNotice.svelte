<script lang="ts">
  import cx from "classnames"
  import {formatTimestamp} from "@welshman/app"
  import {messageAndColorFromStatus, type PublishNotice} from "src/domain/connection"

  export let notice: PublishNotice

  const {color} = messageAndColorFromStatus(notice.status)
</script>

<div class="flex flex-wrap gap-2 p-2">
  <span class="shrink-0 text-neutral-400">{formatTimestamp(notice.created_at)}</span>
  <strong
    class={cx(color, "max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-success")}
    >to {notice.url}</strong>
  <span class="shrink-0">[Kind {notice.eventKind}]</span>
  <span>{notice.message}</span>
</div>
