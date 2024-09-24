<script lang="ts">
  import {displayUrl} from "@welshman/lib"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"

  export let value

  const url = value.url.toString()
</script>

<Link external href={url} class="link-content">
  <Icon icon="link-round" size={3} class="inline-block" />
  {displayUrl(url)}
</Link>
