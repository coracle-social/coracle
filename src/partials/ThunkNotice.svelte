<script lang="ts">
  import {formatTimestamp, type ThunkStatus} from "@welshman/app"
  import {PublishStatus} from "@welshman/net"
  import type {PublishNotice} from "src/domain/connection"

  export let notice: PublishNotice

  function messageAndColorFromStatus(status: ThunkStatus) {
    switch (status.status) {
      case PublishStatus.Success:
        return {message: status.message || "Published", color: "text-success"}
      case PublishStatus.Pending:
        return {message: status.message || "Pending", color: "text-warning"}
      case PublishStatus.Failure:
        return {message: status.message || "Failed", color: "text-danger"}
      case PublishStatus.Timeout:
        return {message: status.message || "Timed out", color: "text-accent"}
      case PublishStatus.Aborted:
        return {message: status.message || "Aborted", color: "text-accent"}
    }
  }

  const {message, color} = messageAndColorFromStatus(notice.status)
</script>

<div class="flex gap-2 p-2">
  <span class="shrink-0 text-neutral-400">{formatTimestamp(notice.created_at)}</span>
  <strong class={color}>to {notice.url}:</strong>
  <span class="shrink-0">[Kind {notice.eventKind}]</span>
  <span class="">{notice.message || message}</span>
</div>
