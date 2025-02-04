<script lang="ts">
  interface Props {
    input?: import("svelte").Snippet
    content?: import("svelte").Snippet
    [key: string]: any
  }

  const {...props}: Props = $props()
</script>

<div class="col-2 content-padding-t content-padding-x h-full {props.class}">
  <div class="z-feature">
    <div class="content-sizing">
      {@render props.input?.()}
    </div>
  </div>
  <div class="scroll-container overflow-auto pt-2">
    <div class="content-sizing">
      {@render props.content?.()}
    </div>
  </div>
</div>
