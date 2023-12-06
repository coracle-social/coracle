<script lang="ts">
  import cx from "classnames"
  import {imgproxy} from "src/engine"

  export let src: string

  const url = imgproxy(src, {w: 280, h: 280})
</script>

<div
  class={cx(
    $$props.class,
    "inline-block shrink-0 overflow-hidden rounded-full bg-black bg-cover bg-center"
  )}
  style={`background-image: url(${url}); ${$$props.style || ""}`}>
  <slot />
</div>
