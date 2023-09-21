<script lang="ts">
  import cx from "classnames"
  import {imgproxy} from "src/engine"

  export let src: string
  export let size = 4

  const url = imgproxy(src, {w: size * 20, h: size * 20})
</script>

<div
  class={cx(
    $$props.class,
    `overflow-hidden w-${size} h-${size} inline-block shrink-0 rounded-full border border-solid
     border-gray-1 bg-gray-9 bg-cover bg-center`
  )}
  style={`background-image: url(${url}); ${$$props.style || ""}`}>
  <slot />
</div>
