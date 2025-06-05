<script lang="ts">
  import {removeNil} from "@welshman/lib"
  import {displayPubkey} from "@welshman/util"
  import {deriveHandleForPubkey, displayHandle, deriveProfileDisplay} from "@welshman/app"
  import WotScore from "@app/components/WotScore.svelte"
  import ProfileCircle from "@app/components/ProfileCircle.svelte"

  type Props = {
    value: string
    url?: string
  }

  const {value, url}: Props = $props()

  const pubkey = value
  const profileDisplay = deriveProfileDisplay(pubkey, removeNil([url]))
  const handle = deriveHandleForPubkey(pubkey)
</script>

<div class="flex max-w-full gap-3">
  <div class="py-1">
    <ProfileCircle {pubkey} {url} />
  </div>
  <div class="flex min-w-0 flex-col">
    <div class="flex items-center gap-2">
      <div class="text-bold overflow-hidden text-ellipsis text-base">
        {$profileDisplay}
      </div>
      <WotScore {pubkey} />
    </div>
    <div class="overflow-hidden text-ellipsis text-sm opacity-75">
      {$handle ? displayHandle($handle) : displayPubkey(pubkey)}
    </div>
  </div>
</div>
