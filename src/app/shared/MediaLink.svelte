<script lang="ts">
  import {displayUrl} from "src/util/misc"

  export let url: string
  export let onClick: (url: string, event: any) => void

  const _onClick = (e: {detail: any}) => onClick(url, e.detail)
</script>

<a
  href={url}
  class="overflow-hidden text-ellipsis whitespace-nowrap underline"
  on:click|preventDefault={_onClick}>
  {displayUrl(url)}
</a>
