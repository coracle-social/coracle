<script lang="ts">
  import {stringToHue, hsl} from "src/util/misc"
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import LogoSvg from "src/partials/LogoSvg.svelte"
  import cx from "classnames"

  export let person
  export let size = 4

  const hue = stringToHue(person.pubkey)
  const primary = hsl(hue, {lightness: 80})
  const secondary = hsl(hue, {saturation: 30, lightness: 30})
</script>

{#if person.kind0?.picture}
  <ImageCircle {size} src={person.kind0.picture} class={$$props.class} />
{:else}
  <div
    class={cx(
      $$props.class,
      `relative overflow-hidden w-${size} h-${size} inline-block shrink-0 rounded-full border border-solid
       border-white bg-cover bg-center`
    )}
    style="--logo-color: {primary}; --logo-bg-color: {secondary}; background-color: var(--logo-bg-color);">
    <LogoSvg
      class="logo absolute left-2/4 top-2/4 -translate-x-1/2 -translate-y-1/2"
      style="height: 85%; width: 85%;" />
  </div>
{/if}
