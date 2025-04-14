<script lang="ts">
  import cx from "classnames"
  import {PublishStatus} from "@welshman/net"
  import {formatTimestamp} from "@welshman/app"
  import type {PublishNotice} from "src/domain/connection"

  export let notice: PublishNotice

  let color = "text-success"

  if (notice.status === PublishStatus.Sending) {
    color = "text-warning"
  }

  if (notice.status === PublishStatus.Pending) {
    color = "text-warning"
  }

  if (notice.status === PublishStatus.Failure) {
    color = "text-danger"
  }

  if (notice.status === PublishStatus.Timeout) {
    color = "text-accent"
  }

  if (notice.status === PublishStatus.Aborted) {
    color = "text-accent"
  }

  if (notice.status === PublishStatus.Pending) {
    color = "text-warning"
  }
</script>

<div class="flex flex-wrap gap-2 p-2">
  <span class="shrink-0 text-neutral-400">{formatTimestamp(notice.created_at)}</span>
  <strong
    class={cx(color, "max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-success")}
    >to {notice.url}</strong>
  <span class="shrink-0">[Kind {notice.eventKind}]</span>
  <span>{notice.message}</span>
</div>
