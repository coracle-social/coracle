<script lang="ts">
  import {now} from "@welshman/lib"
  import cx from "classnames"
  import {stringToHue, hsl, timestamp1} from "src/util/misc"

  export let pubkey

  let mount = now()

  const hue = stringToHue(pubkey || "")
  const primary = hsl(hue, {lightness: 80})
  const secondary = hsl(hue, {saturation: 30, lightness: 30})

  $: loading = mount > $timestamp1 - 3
</script>

<div
  class="{cx(
    $$props.class,
    `flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-solid border-neutral-100 bg-cover bg-center`,
  )}}">
  <i
    class="fa fa-user text-xl"
    class:animate-pulse={loading}
    style="background: linear-gradient(to right, {primary}, {secondary}); -webkit-background-clip: text; color: transparent;"
  ></i>
</div>
