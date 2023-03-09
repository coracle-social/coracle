<script lang="ts">
  import { invertColor, stringToHex } from "src/util/misc";
  import ImageCircle from "./ImageCircle.svelte";
  import LogoSvg from "./LogoSvg.svelte";
  import cx from "classnames";

  export let person;
  export let size = 4;

  const color = stringToHex(person.pubkey);
  const bgColor = invertColor(color);
</script>

{#if person.kind0?.picture}
  <ImageCircle {size} src={person.kind0.picture} class={$$props.class} />
{:else}
  <ImageCircle
    {size}
    src={""}
    class={cx($$props.class, "test", "relative")}
    style="--logo-color: {color}; --logo-bg-color: {bgColor}; background-color: var(--logo-bg-color);"
  >
    <LogoSvg class="absolute left-2/4 top-2/4 -translate-x-1/2 -translate-y-1/2 logo" style="height: 85%; width: 85%;" />
  </ImageCircle>
{/if}
