<script lang="ts">
  import {isMobile} from "@lib/html"

  const {children, onTap, ...restProps} = $props()

  const onclick = (event: MouseEvent) => {
    if (isMobile) {
      onTap(event)
    }
  }
</script>

<div role="button" tabindex="0" {onclick} {...restProps}>
  {@render children()}
</div>
