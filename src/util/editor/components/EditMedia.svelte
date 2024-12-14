<script lang="ts">
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"

  export let node: NodeViewProps["node"]
  export let selected: NodeViewProps["selected"]

  $: selectedClass = selected ? "tiptap-active" : ""
  $: uploadingClass = node.attrs.uploading ? "tiptap-uploading" : ""
</script>

<NodeViewWrapper as="span" class="tiptap-object {selectedClass} {uploadingClass}">
  {node.attrs.file?.name || node.attrs.src}
</NodeViewWrapper>
