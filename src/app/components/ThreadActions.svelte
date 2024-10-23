<script lang="ts">
  import {type Instance} from "tippy.js"
  import type {NativeEmoji} from "emoji-picker-element/shared"
  import {pubkey} from "@welshman/app"
  import type {TrustedEvent} from "@welshman/util"
  import Icon from "@lib/components/Icon.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import Button from "@lib/components/Button.svelte"
  import EmojiButton from "@lib/components/EmojiButton.svelte"
  import Reactions from "@app/components/Reactions.svelte"
  import ThreadMenu from "@app/components/ThreadMenu.svelte"
  import {publishDelete, publishReaction} from "@app/commands"

  export let url
  export let event

  const showPopover = () => popover.show()

  const hidePopover = () => popover.hide()

  const onReactionClick = (content: string, events: TrustedEvent[]) => {
    const reaction = events.find(e => e.pubkey === $pubkey)

    if (reaction) {
      publishDelete({relays: [url], event: reaction})
    } else {
      publishReaction({event, content, relays: [url]})
    }
  }

  const onEmoji = (emoji: NativeEmoji) =>
    publishReaction({event, relays: [url], content: emoji.unicode})

  let popover: Instance
</script>

<div class="flex items-center justify-between">
  <div>
    <Reactions {event} {onReactionClick} />
  </div>
  <div class="join">
    <EmojiButton {onEmoji} class="join-item btn-neutral" />
    <Tippy
      bind:popover
      component={ThreadMenu}
      props={{url, event, onClick: hidePopover}}
      params={{trigger: "manual", interactive: true}}>
      <Button class="btn btn-neutral btn-xs join-item" on:click={showPopover}>
        <Icon icon="menu-dots" size={4} />
      </Button>
    </Tippy>
  </div>
</div>
