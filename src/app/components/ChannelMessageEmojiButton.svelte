<script lang="ts">
  import tippy, {type Instance} from "tippy.js"
  import type {NativeEmoji} from 'emoji-picker-element/shared'
  import {between} from '@welshman/lib'
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import EmojiPicker from "@lib/components/EmojiPicker.svelte"
  import {tagRoom} from '@app/state'
  import {publishReaction} from '@app/commands'

  export let url, room, event

  const open = () => popover.show()

  const onClick = (emoji: NativeEmoji) => {
    publishReaction({
      event,
      relays: [url],
      content: emoji.unicode,
      tags: [tagRoom(room, url)],
    })

    popover.hide()
  }

  const onMouseMove = ({clientX, clientY}: any) => {
    const {x, y, width, height} = popover.popper.getBoundingClientRect()

    if (!between([x, x + width], clientX) || !between([y, y + height + 30], clientY)) {
      popover.hide()
    }
  }

  let popover: Instance
</script>

<svelte:document on:mousemove={onMouseMove} />

<div class="flex">
  <Button class="btn join-item btn-xs" on:click={open}>
    <Icon icon="smile-circle" size={4} />
  </Button>
  <Tippy
    bind:popover
    component={EmojiPicker}
    props={{onClick}}
    params={{
      trigger: "manual",
      interactive: true,
    }}
  />
</div>
