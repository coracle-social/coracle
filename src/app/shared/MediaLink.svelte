<script lang="ts">
  import {displayUrl} from "@welshman/lib"

  export let url: string
  export let onClick: (url: string, event: any) => void

  const _onClick = (e: any) => onClick(url, e)
</script>

<a
  href={url}
  on:click|preventDefault|stopPropagation={_onClick}
  class="overflow-hidden text-ellipsis whitespace-nowrap underline">
  {displayUrl(url)}
</a>
