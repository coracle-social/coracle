<script lang="ts">
  import cx from "classnames"
  import {Settings} from "src/app/engine"

  export let src: string
  export let size = 4

  const url = Settings.imgproxy(src, {w: size * 4, h: size * 4})
</script>

<div
  class={cx(
    $$props.class,
    `overflow-hidden w-${size} h-${size} inline-block shrink-0 rounded-full border border-solid
     border-gray-1 bg-cover bg-center`
  )}
  style={`background-image: url(${url}); ${$$props.style || ""}`}>
  <slot />
</div>
