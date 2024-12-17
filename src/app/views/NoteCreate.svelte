<script lang="ts">
  import {onMount} from "svelte"
  import {ctx, last} from "@welshman/lib"
  import {createEvent, toNostrURI} from "@welshman/util"
  import {session, tagPubkey} from "@welshman/app"
  import {PublishStatus} from "@welshman/net"
  import {commaFormat} from "hurdak"
  import {writable, type Writable} from "svelte/store"
  import {Editor} from "svelte-tiptap"
  import {nip19} from "nostr-tools"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Field from "src/partials/Field.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import {showPublishInfo, showToast, showWarning} from "src/partials/Toast.svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import NsecWarning from "src/app/shared/NsecWarning.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import NoteOptions from "src/app/shared/NoteOptions.svelte"
  import {getEditorOptions} from "src/app/editor"
  import {drafts} from "src/app/state"
  import {router} from "src/app/util/router"
  import {getClientTags, publish, sign, tagsFromContent, userSettings} from "src/engine"

  export let quote = null
  export let pubkey = null

  let charCount: Writable<number>
  let wordCount: Writable<number>
  let showPreview = false
  let showOptions = false
  let signaturePending = false

  let editor: Editor
  let element: HTMLElement
  let options = {warning: "", anonymous: false}

  const nsecWarning = writable(null)

  const openOptions = () => {
    showOptions = true
  }

  const closeOptions = () => {
    showOptions = false
  }

  const setOptions = values => {
    options = {...options, ...values}
    showOptions = false
  }

  const bypassNsecWarning = () => {
    nsecWarning.set(null)
    onSubmit({skipNsecWarning: true})
  }

  const onSubmit = async ({skipNsecWarning = false} = {}) => {
    // prevent sending before media are uploaded and tags are correctly set
    if ($loading) return

    signaturePending = true

    const content = editor.getText({blockSeparator: "\n"}).trim()

    console.log(content)

    // if (!content) return showWarning("Please provide a description.")

    // if (!skipNsecWarning && content.match(/\bnsec1.+/)) return nsecWarning.set(true)

    // const tags = [...tagsFromContent(content), ...getClientTags(), ...editor.commands.getMetaTags()]

    // if (options.warning) {
    //   tags.push(["content-warning", options.warning])
    // }

    // if (quote) {
    //   tags.push(tagPubkey(quote.pubkey))
    // }

    // const template = createEvent(1, {content, tags})
    // const signedTemplate = await sign(template, options)

    // signaturePending = false

    // drafts.set("notecreate", editor.getHTML())

    // router.clearModals()

    // const thunk = publish({
    //   event: signedTemplate,
    //   relays: ctx.app.router.PublishEvent(signedTemplate).getUrls(),
    //   delay: $userSettings.send_delay,
    // })

    // thunk.result.finally(() => {
    //   charCount.set(0)
    //   wordCount.set(0)
    //   drafts.delete("notecreate")
    // })

    // if ($userSettings.send_delay > 0) {
    //   showToast({
    //     id: "send-delay",
    //     type: "delay",
    //     timeout: $userSettings.send_delay / 1000,
    //     onCancel: () => {
    //       thunk.controller.abort()
    //       router.at("notes/create").open()
    //     },
    //   })
    // }

    // thunk.status.subscribe(status => {
    //   if (
    //     Object.values(status).length === thunk.request.relays.length &&
    //     Object.values(status).every(s => s.status === PublishStatus.Pending)
    //   ) {
    //     showPublishInfo(thunk)
    //   }
    // })
  }

  const togglePreview = () => {
    showPreview = !showPreview
  }

  const pubkeyEncoder = {
    encode: pubkey => {
      const relays = ctx.app.router.FromPubkeys([pubkey]).getUrls()
      const nprofile = nip19.nprofileEncode({pubkey, relays})

      return toNostrURI(nprofile)
    },
    decode: link => {
      // @ts-ignore
      return nip19.decode(last(link.split(":"))).data.pubkey
    },
  }

  onMount(() => {
    editor = new Editor(
      getEditorOptions({
        content: drafts.get("notecreate") || "",
        submit: onSubmit,
        element,
        submitOnEnter: false,
        submitOnModEnter: true,
        autofocus: true,
      }),
    )

    charCount = editor.storage.wordCount.characters
    wordCount = editor.storage.wordCount.words

    if (pubkey && pubkey !== $session.pubkey) {
      editor.commands.insertNProfile({nprofile: pubkeyEncoder.encode(pubkey)})
    }

    if (quote) {
      const nevent = nip19.neventEncode({
        id: quote.id,
        kind: quote.kind,
        author: quote.pubkey,
        relays: ctx.app.router.Event(quote).getUrls(),
      })

      editor.commands.insertNEvent({nevent: toNostrURI(nevent)})
    }
  })

  $: loading = editor?.storage.fileUpload.loading
</script>

<form on:submit|preventDefault={() => onSubmit()}>
  <Content size="lg">
    <div class="flex gap-2">
      <span class="text-2xl font-bold">Create a Note</span>
    </div>
    <FlexColumn>
      <Field label="What do you want to say?">
        <div
          class="rounded-xl border border-solid border-neutral-600 p-3"
          class:bg-white={!showPreview}
          class:text-black={!showPreview}
          class:bg-tinted-700={showPreview}>
          {#if showPreview}
            <NoteContent
              note={{content: editor.getText({blockSeparator: "\n"}).trim(), tags: []}} />
          {/if}
          <div class:hidden={showPreview}>
            <Compose bind:element {editor} class="min-h-24" />
          </div>
        </div>
        <div class="flex items-center justify-end gap-2 text-neutral-200">
          <small>
            {commaFormat($charCount || 0)} characters
          </small>
          <span>•</span>
          <small>
            {commaFormat($wordCount || 0)} words
          </small>
          <span>•</span>
          <button type="button" on:click={togglePreview} class="cursor-pointer text-sm underline">
            {showPreview ? "Hide" : "Show"} Preview
          </button>
          <button type="button" on:click={openOptions} class="cursor-pointer text-sm">
            <i class="fa fa-cog" />
          </button>
        </div>
      </Field>
      <div class="flex gap-2">
        <Anchor
          button
          tag="button"
          type="submit"
          class="flex-grow"
          disabled={$loading || signaturePending}>
          {#if signaturePending}
            <i class="fa fa-circle-notch fa-spin" />
          {:else}
            Send
          {/if}
        </Anchor>
        <button
          class="hover:bg-white-l staatliches flex h-7 w-7 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded bg-white px-6 text-xl text-black transition-all"
          on:click|preventDefault={editor.commands.selectFiles}>
          <i class="fa fa-upload" />
        </button>
      </div>
    </FlexColumn>
  </Content>
</form>

{#if showOptions}
  <NoteOptions onClose={closeOptions} onSubmit={setOptions} initialValues={options} />
{/if}

{#if $nsecWarning}
  <NsecWarning onAbort={() => nsecWarning.set(null)} onBypass={bypassNsecWarning} />
{/if}
