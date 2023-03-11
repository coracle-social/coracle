<script lang="ts">
  import { generateAvatarColors } from "src/util/misc";
  import ImageCircle from "./ImageCircle.svelte";
  import LogoSvg from "./LogoSvg.svelte";
  import cx from "classnames";
  import type { Person } from "src/util/types"

  export let person : Person;
  export let size = 4;

  $: avatarColor = person.kind0 && !person.kind0.picture
    ? generateAvatarColors(person.pubkey)
    : { primary: '#EB5E28', bg: 'transparent' };
</script>

{#if person.kind0?.picture}
  <ImageCircle {size} src={person.kind0.picture} class={$$props.class} />
{:else}
  <ImageCircle
    {size}
    src={""}
    class={cx($$props.class, "relative")}
    style="--logo-color: {avatarColor.primary}; --logo-bg-color: {avatarColor.bg}; background-color: var(--logo-bg-color);"
  >
    <LogoSvg class="absolute left-2/4 top-2/4 -translate-x-1/2 -translate-y-1/2 logo" style="height: 85%; width: 85%;" />
  </ImageCircle>
{/if}
