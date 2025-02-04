<script lang="ts">
  import cx from "classnames"
  import type {Snippet} from "svelte"
  import {nip19} from "nostr-tools"
  import {ctx} from "@welshman/lib"
  import {getListTags, getPubkeyTagValues} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import {formatTimestamp, userMutes} from "@welshman/app"
  import Link from "@lib/components/Link.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Profile from "@app/components/Profile.svelte"
  import ProfileName from "@app/components/ProfileName.svelte"
  import {entityLink} from "@app/state"

  const {
    event,
    children,
    minimal = false,
    hideProfile = false,
    ...restProps
  }: {
    event: TrustedEvent
    children: Snippet
    minimal?: boolean
    hideProfile?: boolean
    class?: string
  } = $props()

  const relays = ctx.app.router.Event(event).getUrls()
  const nevent = nip19.neventEncode({id: event.id, relays})

  const ignoreMute = () => {
    muted = false
  }

  let muted = $state(getPubkeyTagValues(getListTags($userMutes)).includes(event.pubkey))
</script>

<div class="flex flex-col gap-2 {restProps.class}">
  {#if muted}
    <div class="flex items-center justify-between">
      <div class="row-2 relative">
        <Icon icon="danger" class="mt-1" />
        <p>You have muted this person.</p>
      </div>
      <Button class="link ml-8" onclick={ignoreMute}>Show anyway</Button>
    </div>
  {:else}
    <div class="flex justify-between gap-2">
      {#if !hideProfile}
        {#if minimal}
          @<ProfileName pubkey={event.pubkey} />
        {:else}
          <Profile pubkey={event.pubkey} />
        {/if}
      {/if}
      <Link
        external
        href={entityLink(nevent)}
        class={cx("text-sm opacity-75", {"text-xs": minimal})}>
        {formatTimestamp(event.created_at)}
      </Link>
    </div>
    {@render children()}
  {/if}
</div>
