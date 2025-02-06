<script lang="ts">
  import type {Component} from "svelte"
  import type {Instance} from "tippy.js"
  import type {NativeEmoji} from "emoji-picker-element/shared"
  import type {TrustedEvent} from "@welshman/util"
  import Icon from "@lib/components/Icon.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import Button from "@lib/components/Button.svelte"
  import EmojiButton from "@lib/components/EmojiButton.svelte"
  import {publishReaction} from "@app/commands"

  const {
    url,
    event,
    component,
  }: {
    url: string
    event: TrustedEvent
    component: Component<any>
  } = $props()

  const showPopover = () => popover?.show()

  const hidePopover = () => popover?.hide()

  const onEmoji = (emoji: NativeEmoji) =>
    publishReaction({event, content: emoji.unicode, relays: [url]})

  let popover: Instance | undefined = $state()
</script>

<Button class="join rounded-full">
  <EmojiButton {onEmoji} class="btn join-item btn-neutral btn-xs">
    <Icon icon="smile-circle" size={4} />
  </EmojiButton>
  <Tippy
    {component}
    bind:popover
    props={{url, event, onClick: hidePopover}}
    params={{trigger: "manual", interactive: true}}>
    <Button class="btn join-item btn-neutral btn-xs" onclick={showPopover}>
      <Icon icon="menu-dots" size={4} />
    </Button>
  </Tippy>
</Button>
