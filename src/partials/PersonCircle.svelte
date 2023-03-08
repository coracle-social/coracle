<script lang="ts">
  import ImageCircle from "./ImageCircle.svelte";

  export let src;
  export let size = 4;
</script>

<ImageCircle {size} src={src || "/images/avatar.svg"} class={$$props.class} />
