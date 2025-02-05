<script lang="ts">
  import {onDestroy} from "svelte"
  import {type Instance} from "tippy.js"
  import type {NativeEmoji} from "emoji-picker-element/shared"
  import {between, throttle} from "@welshman/lib"
  import Button from "@lib/components/Button.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import EmojiPicker from "@lib/components/EmojiPicker.svelte"

  const {...props} = $props()

  const open = () => popover?.show()

  const onClick = (emoji: NativeEmoji) => {
    props.onEmoji(emoji)
    popover?.hide()
  }

  const onMouseMove = throttle(300, ({clientX, clientY}: any) => {
    if (popover) {
      const {x, y, width, height} = popover.popper.getBoundingClientRect()

      if (!between([x, x + width], clientX) || !between([y - 30, y + height + 30], clientY)) {
        popover.hide()
      }
    }
  })

  let popover: Instance | undefined = $state()

  onDestroy(() => {
    popover = undefined
  })
</script>

<svelte:document onmousemove={onMouseMove} />

<Tippy
  bind:popover
  component={EmojiPicker}
  props={{onClick}}
  params={{trigger: "manual", interactive: true}}>
  <Button onclick={open} class={props.class}>
    {@render props.children?.()}
  </Button>
</Tippy>
