<script lang="ts">
  import {throttle} from "throttle-debounce"
  import {type Instance} from "tippy.js"
  import type {NativeEmoji} from "emoji-picker-element/shared"
  import {between} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import EmojiPicker from "@lib/components/EmojiPicker.svelte"
  import {makeReaction, sendWrapped} from "@app/commands"

  export let event: TrustedEvent
  export let pubkeys: string[]

  const open = () => popover.show()

  const onClick = async (emoji: NativeEmoji) => {
    const template = makeReaction({event, content: emoji.unicode})

    sendWrapped({template, pubkeys})
    popover.hide()
  }

  const onMouseMove = throttle(300, ({clientX, clientY}: any) => {
    const {x, y, width, height} = popover.popper.getBoundingClientRect()

    if (!between([x, x + width], clientX) || !between([y - 30, y + height + 30], clientY)) {
      popover.hide()
    }
  })

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
    }} />
</div>
