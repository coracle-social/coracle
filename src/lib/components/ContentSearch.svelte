<script lang="ts">
  interface Props {
    input?: import("svelte").Snippet
    content?: import("svelte").Snippet
    [key: string]: any
  }

  const {...props}: Props = $props()
</script>

<div class="content-padding-t content-padding-x flex h-full flex-col gap-1 {props.class}">
  <div class="z-feature">
    <div class="content-sizing">
      {@render props.input?.()}
    </div>
  </div>
  <div class="scroll-container overflow-auto">
    <div class="content-sizing">
      {@render props.content?.()}
    </div>
  </div>
</div>
