<script lang="ts">
  import {displayHandle} from "@welshman/util"
  import {displayPubkey} from "@welshman/domain"
  import {Handles, Profiles, Wot, WotScope} from "@welshman/app"
  import {fromApp} from "src/engine/core"
  import {userFollows} from "src/engine"
  import WotScore from "src/partials/WotScore.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"

  export let value

  const pubkey = value
  const profileDisplay = fromApp($app => $app.use(Profiles).display(pubkey).$)
  const handle = fromApp($app => $app.use(Handles).forPubkey(pubkey).$)
  // Scored against the user's own follows, which is what deriveUserWotScore did
  const score = fromApp($app => $app.use(Wot).score(pubkey, WotScope.Follows).$)

  $: following = $userFollows.has(pubkey)
</script>

<div class="flex max-w-full gap-3">
  <div class="py-1">
    <PersonCircle {pubkey} class="h-10 w-10" />
  </div>
  <div class="flex min-w-0 flex-col">
    <div class="flex items-center gap-2">
      <div class="text-bold overflow-hidden text-ellipsis text-base">
        {$profileDisplay}
      </div>
      <WotScore score={$score} accent={following} />
    </div>
    <div class="overflow-hidden text-ellipsis text-sm opacity-75">
      {$handle ? displayHandle($handle) : displayPubkey(pubkey)}
    </div>
  </div>
</div>
