<script lang="ts">
  import cx from "classnames"
  import {stringToHue, hsl} from "src/util/misc"
  import LogoSvg from "src/partials/LogoSvg.svelte"

  export let pubkey

  const hue = stringToHue(pubkey || "")
  const primary = hsl(hue, {lightness: 80})
  const secondary = hsl(hue, {saturation: 30, lightness: 30})
</script>

<div
  class={cx(
    $$props.class,
    `relative inline-block shrink-0 overflow-hidden rounded-full border border-solid border-neutral-100 bg-cover bg-center`,
  )}
  s}
  style="--logo-color: {primary}; --}; --logo-bg-color: {secondary}; ba}; background-color: var(--logo-bg-color);">
  <LogoSvg
    class="logo absolute left-2/4 top-2/4 -translate-x-1/2 -translate-y-1/2"
    style="height: 85%; width: 85%;"></LogoSvg>
</div>
