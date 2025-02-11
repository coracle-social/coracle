<script lang="ts">
  import type {ComponentProps} from "svelte"
  import Content from "@app/components/Content.svelte"

  const props: ComponentProps<typeof Content> = $props()
</script>

<Content {...props} />
