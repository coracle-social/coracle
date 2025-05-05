<script lang="ts">
  import {writable} from "svelte/store"
  import type {EventContent} from "@welshman/util"
  import {isMobile, preventDefault} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import EditorContent from "@app/editor/EditorContent.svelte"
  import {makeEditor} from "@app/editor"

  type Props = {
    url?: string
    onSubmit: (event: EventContent) => void
  }

  const {onSubmit, url}: Props = $props()

  const autofocus = !isMobile

  const uploading = writable(false)

  export const focus = () => editor.then(ed => ed.chain().focus().run())

  const submit = async () => {
    if ($uploading) return

    const ed = await editor
    const content = ed.getText({blockSeparator: "\n"}).trim()
    const tags = ed.storage.nostr.getEditorTags()

    if (!content) return

    onSubmit({content, tags})

    ed.chain().clearContent().run()
  }

  const editor = makeEditor({
    url,
    autofocus,
    submit,
    uploading,
    aggressive: true,
    disableFileUpload: true,
  })
</script>

<form class="relative z-feature flex gap-2 p-2" onsubmit={preventDefault(submit)}>
  <div class="chat-editor flex-grow overflow-hidden">
    <EditorContent {editor} />
  </div>
  <Button
    data-tip="{window.navigator.platform.includes('Mac') ? 'cmd' : 'ctrl'}+enter to send"
    class="center tooltip tooltip-left absolute right-4 h-10 w-10 min-w-10 rounded-full"
    disabled={$uploading}
    onclick={submit}>
    <Icon icon="plain" />
  </Button>
</form>
