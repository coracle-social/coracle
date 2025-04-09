<script lang="ts">
  import {onMount} from "svelte"
  import {last, type Emitter} from "@welshman/lib"
  import {now, own, hash} from "@welshman/signer"
  import type {TrustedEvent} from "@welshman/util"
  import {
    createEvent,
    toNostrURI,
    DVM_REQUEST_PUBLISH_SCHEDULE,
    Address,
    isReplaceable,
  } from "@welshman/util"
  import type {Thunk} from "@welshman/app"
  import {session, Router, tagPubkey, signer, abortThunk, addMaximalFallbacks} from "@welshman/app"
  import {DVMEvent} from "@welshman/dvm"
  import {writable} from "svelte/store"
  import * as nip19 from "nostr-tools/nip19"
  import {makePow} from "src/util/pow"
  import type {ProofOfWork} from "src/util/pow"
  import {warn} from "src/util/logger"
  import {commaFormat} from "src/util/misc"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Field from "src/partials/Field.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import {showInfo, showPublishInfo, showToast, showWarning} from "src/partials/Toast.svelte"
  import EditorContent from "src/app/editor/EditorContent.svelte"
  import NsecWarning from "src/app/shared/NsecWarning.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import NoteOptions from "src/app/shared/NoteOptions.svelte"
  import {makeEditor} from "src/app/editor"
  import {drafts} from "src/app/state"
  import {router} from "src/app/util/router"
  import {env, getClientTags, makeDvmRequest, publish, sign, userSettings} from "src/engine"

  export let quote = null
  export let pubkey = null

  const uploading = writable(false)
  const wordCount = writable(0)
  const charCount = writable(0)
  const SHIPYARD_PUBKEY = "85c20d3760ef4e1976071a569fb363f4ff086ca907669fb95167cdc5305934d1"
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
    // prevent sending before media are uploaded
    if ($uploading || publishing) return

    const content = editor.getText({blockSeparator: "\n"}).trim()

    if (!content) return showWarning("Please provide a description.")

    if (!skipNsecWarning && content.match(/\bnsec1.+/)) return nsecWarning.set(true)

    const tags = [...editor.storage.nostr.getEditorTags(), ...getClientTags()]

    if (options.warning) {
      tags.push(["content-warning", options.warning])
    }

    if (quote) {
      tags.push(tagPubkey(quote.pubkey))
    }

    const ownedEvent = own(
      createEvent(1, {
        content,
        tags,
        created_at:
          (options.publish_at && Math.floor(options.publish_at.getTime() / 1000)) || undefined,
      }),
      $session.pubkey,
    )

    let hashedEvent = hash(ownedEvent)

    if (options.pow_difficulty) {
      publishing = "pow"

      pow?.worker.terminate()
      pow = makePow(ownedEvent, options.pow_difficulty)

      hashedEvent = await pow.result
    }

    publishing = "signing"

    const signedEvent = await sign(hashedEvent, options)
    const relays = Router.get().PublishEvent(signedEvent).policy(addMaximalFallbacks).getUrls()

    let thunk: Thunk, emitter: Emitter

    router.clearModals()
    drafts.delete(DRAFT_KEY)

    if (options.publish_at) {
      const dvmContent = await $signer.nip04.encrypt(
        SHIPYARD_PUBKEY,
        JSON.stringify([
          ["i", JSON.stringify(signedEvent), "text"],
          ["param", "relays", ...relays],
        ]),
      )

      const dvmEvent = await sign(
        createEvent(DVM_REQUEST_PUBLISH_SCHEDULE, {
          content: dvmContent,
          tags: [["p", SHIPYARD_PUBKEY], ["encrypted"]],
        }),
      )

      const dvmRequest = makeDvmRequest({
        event: dvmEvent,
        relays: env.DVM_RELAYS,
        reportProgress: true,
        delay: $userSettings.send_delay,
      })

      thunk = dvmRequest.thunk
      emitter = dvmRequest.emitter
    } else {
      router.clearModals()

      thunk = publish({relays, event: signedEvent, delay: $userSettings.send_delay})
    }

    thunk.result.finally(() => {
      charCount.set(0)
      wordCount.set(0)
    })

    let aborted = false

    if ($userSettings.send_delay > 0) {
      await showToast({
        type: "delay",
        timeout: $userSettings.send_delay / 1000,
        onCancel: () => {
          aborted = true
          abortThunk(thunk)
          router.at("notes/create").open()
          drafts.set(DRAFT_KEY, editor.getHTML())
        },
      })
    }

    if (!aborted) {
      showPublishInfo(thunk)
    }

    if (emitter) {
      emitter.on(DVMEvent.Progress, (url: string, event: TrustedEvent) => {
        $signer.nip04.decrypt(SHIPYARD_PUBKEY, event.content).then(data => {
          try {
            data = JSON.parse(data)[0]
            showInfo(data[2] || "Your note is " + data[1] + "!")
          } catch (e) {
            warn(e)
          }
        })
      })
    }

    publishing = null
  }

  const togglePreview = () => {
    showPreview = !showPreview
  }

  const pubkeyEncoder = {
    encode: pubkey => {
      const relays = Router.get().FromPubkeys([pubkey]).limit(3).getUrls()
      const nprofile = nip19.nprofileEncode({pubkey, relays})

      return toNostrURI(nprofile)
    },
    decode: link => {
      // @ts-ignore
      return nip19.decode(last(link.split(":"))).data.pubkey
    },
  }

  let DRAFT_KEY = "notecreate"

  if (pubkey) {
    DRAFT_KEY += `:${pubkey}`
  }

  if (quote) {
    DRAFT_KEY += `:${quote.id}`
  }

  const draft = drafts.get(DRAFT_KEY) || ""

  const editor = makeEditor({
    autofocus: true,
    content: draft,
    submit: onSubmit,
    onUpdate: () => {
      drafts.set(DRAFT_KEY, editor.getHTML())
    },
    onUploadError: (url, file) => {
      showWarning(`Failed to upload file to ${url}: ${file.uploadError}`)
    },
    uploading,
    charCount,
    wordCount,
  })

  let showPreview = false
  let showOptions = false
  let publishing: "signing" | "pow"
  let pow: ProofOfWork
  let options = {
    warning: "",
    anonymous: false,
    publish_at: null,
    pow_difficulty: $userSettings.pow_difficulty,
  }

  onMount(() => {
    if (quote && isReplaceable(quote)) {
      const relays = Router.get().Event(quote).limit(3).getUrls()
      const naddr = Address.fromEvent(quote, relays).toNaddr()

      editor.commands.insertContent("\n")
      editor.commands.insertNAddr({bech32: toNostrURI(naddr)})
    } else if (quote) {
      const nevent = nip19.neventEncode({
        id: quote.id,
        kind: quote.kind,
        author: quote.pubkey,
        relays: Router.get().Event(quote).limit(3).getUrls(),
      })

      editor.commands.insertContent("\n")
      editor.commands.insertNEvent({bech32: toNostrURI(nevent)})
    } else if (pubkey && pubkey !== $session.pubkey) {
      editor.commands.insertNProfile({bech32: pubkeyEncoder.encode(pubkey)})
    }

    return () => {
      pow?.worker.terminate()
      editor.destroy()
    }
  })
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
            <EditorContent {editor} class="min-h-24" />
          </div>
        </div>
        <div class="flex items-center justify-end gap-2 text-neutral-200">
          <small>
            {commaFormat($charCount)} characters
          </small>
          <span>•</span>
          <small>
            {commaFormat($wordCount)} words
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
          disabled={$uploading || Boolean(publishing)}>
          {#if $uploading || !!publishing}
            {#if publishing === "signing"}
              <i class="fa fa-circle-notch fa-spin" /> Signing your note...
            {:else if publishing === "pow"}
              <i class="fa fa-circle-notch fa-spin" /> Generating Work...
            {:else}
              <i class="fa fa-circle-notch fa-spin" /> Uploading media...
            {/if}
          {:else if options?.publish_at && Math.floor(options?.publish_at / 1000) > now()}
            Schedule
          {:else}
            Send
          {/if}
        </Anchor>
        <button
          class="hover:bg-white-l staatliches flex h-7 w-7 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded bg-white px-6 text-xl text-black transition-all"
          on:click|preventDefault={() => editor.chain().selectFiles().run()}>
          <i class="fa fa-upload" />
        </button>
      </div>
    </FlexColumn>
  </Content>
</form>

{#if showOptions}
  <NoteOptions onClose={closeOptions} onSubmit={setOptions} initialValues={options} publishAt />
{/if}

{#if $nsecWarning}
  <NsecWarning onAbort={() => nsecWarning.set(null)} onBypass={bypassNsecWarning} />
{/if}
