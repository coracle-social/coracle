<script lang="ts">
  import {deriveAliasDisplay} from "@app/state"

  type Props = {
    pubkey: string
    url?: string
  }

  const {pubkey, url}: Props = $props()

  const aliasDisplay = deriveAliasDisplay(pubkey, url)
</script>

{$aliasDisplay}
