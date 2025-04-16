<script lang="ts">
  import {removeNil} from "@welshman/lib"
  import {deriveProfileDisplay} from "@welshman/app"

  type Props = {
    pubkey: string
    url?: string
  }

  const {pubkey, url}: Props = $props()

  const profileDisplay = deriveProfileDisplay(pubkey, removeNil([url]))
</script>

{$profileDisplay}
