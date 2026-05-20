<script lang="ts">
  import {onMount} from "svelte"
  import {last, dateToSeconds, now, randomId} from "@welshman/lib"
  import {own, hash} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import {Router, addMinimalFallbacks} from "@welshman/router"
  import {
    makeEvent,
    toNostrURI,
    DVM_REQUEST_PUBLISH_SCHEDULE,
    POLL,
    NOTE,
    Address,
    isReplaceable,
  } from "@welshman/util"
  import type {Thunk} from "@welshman/app"
  import {request} from "@welshman/net"
  import {
    session,
    publishThunk,
    thunkIsComplete,
    tagPubkey,
    signer,
    abortThunk,
  } from "@welshman/app"
  import {writable} from "svelte/store"
  import * as nip19 from "nostr-tools/nip19"
  import {makePow} from "src/util/pow"
  import type {ProofOfWork} from "src/util/pow"
  import {warn} from "src/util/logger"
  import {commaFormat} from "src/util/misc"
  import Button from "src/partials/Button.svelte"
  import Content from "src/partials/Content.svelte"
  import Field from "src/partials/Field.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Input from "src/partials/Input.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import {showInfo, showPublishInfo, showToast, showWarning} from "src/partials/Toast.svelte"
  import EditorContent from "src/app/editor/EditorContent.svelte"
  import NsecWarning from "src/app/shared/NsecWarning.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import type {Values} from "src/app/shared/NoteOptions.svelte"
  import NoteOptions from "src/app/shared/NoteOptions.svelte"
  import {makeEditor} from "src/app/editor"
  import {drafts} from "src/app/state"
  import {router} from "src/app/util/router"
  import {env, getClientTags, sign, userSettings, broadcastUserRelays} from "src/engine"

  export let quote = null
  export let pubkey = null

  const uploading = writable(false)
  const wordCount = writable(0)
  const charCount = writable(0)
  const SHIPYARD_PUBKEY = "5f13f66425c39afa13afd82870952e10d584cebd87f9d02f00ccd871aaaae9eb"
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

  let pollEnabled = false
  let multipleChoice = false
  let pollOptions: {id: string; value: string}[] = []

  const makePollOption = () => ({id: randomId(), value: ""})

  const addPoll = () => {
    pollEnabled = true

    if (pollOptions.length === 0) {
      pollOptions = [makePollOption(), makePollOption()]
    }
  }

  const removePoll = () => {
    pollEnabled = false
  }

  const addPollOption = () => {
    pollOptions = [...pollOptions, makePollOption()]
  }

  const removePollOption = (id: string) => {
    pollOptions = pollOptions.filter(option => option.id !== id)
  }

  const onPollOptionKeydown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault()
      addPollOption()
    }
  }

  const bypassNsecWarning = () => {
    nsecWarning.set(null)
    onSubmit({skipNsecWarning: true})
  }

  const onSubmit = async ({skipNsecWarning = false} = {}) => {
    // prevent sending before media are uploaded
    if ($uploading || publishing) return

    const content = editor.getText({blockSeparator: "\n"}).trim()

    if (!content)
      return showWarning(
        pollEnabled ? "Please provide a poll question." : "Please provide a description.",
      )

    if (!skipNsecWarning && content.match(/\bnsec1.+/)) return nsecWarning.set(true)

    const tags = [...editor.storage.nostr.getEditorTags(), ...getClientTags()]

    if (options.warning) {
      tags.push(["content-warning", options.warning])
    }

    if (options.expiration) {
      tags.push(["expiration", String(dateToSeconds(options.expiration))])
    }

    if (quote) {
      tags.push(tagPubkey(quote.pubkey))
    }

    let kind = NOTE

    if (pollEnabled) {
      const validOptions = pollOptions.filter(option => option.value.trim())

      if (validOptions.length < 2) {
        return showWarning("Please provide at least two poll options.")
      }

      kind = POLL

      for (const option of validOptions) {
        tags.push(["option", option.id, option.value.trim()])
      }

      tags.push(["polltype", multipleChoice ? "multiplechoice" : "singlechoice"])

      for (const url of Router.get().ForUser().policy(addMinimalFallbacks).getUrls()) {
        tags.push(["relay", url])
      }
    }

    const created_at = options.publish_at ? dateToSeconds(options.publish_at) : now()
    const ownedEvent = own(makeEvent(kind, {content, tags, created_at}), $session.pubkey)

    let hashedEvent = hash(ownedEvent)

    if (options.pow_difficulty) {
      publishing = "pow"

      pow?.worker.terminate()
      pow = makePow(ownedEvent, options.pow_difficulty)

      hashedEvent = await pow.result
    }

    publishing = "signing"

    const signedEvent = await sign(hashedEvent, options)
    const relays =
      options.relays?.length > 0
        ? options.relays
        : Router.get().PublishEvent(signedEvent).policy(addMinimalFallbacks).getUrls()

    let thunk: Thunk

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
        makeEvent(DVM_REQUEST_PUBLISH_SCHEDULE, {
          content: dvmContent,
          tags: [["p", SHIPYARD_PUBKEY], ["encrypted"]],
        }),
      )

      thunk = publishThunk({
        event: dvmEvent,
        relays: env.DVM_RELAYS,
        delay: $userSettings.send_delay,
      })

      const abortController = new AbortController()

      await request({
        relays: env.DVM_RELAYS,
        signal: AbortSignal.any([abortController.signal, AbortSignal.timeout(30_000)]),
        filters: [{kinds: [dvmEvent.kind + 1000, 7000], since: now() - 30, "#e": [dvmEvent.id]}],
        onEvent: (event: TrustedEvent, url: string) => {
          if (event.kind === 7000) {
            $signer.nip04.decrypt(SHIPYARD_PUBKEY, event.content).then(data => {
              try {
                data = JSON.parse(data)[0]
                showInfo(data[2] || "Your note is " + data[1] + "!")
              } catch (e) {
                warn(e)
              }
            })
          } else {
            abortController.abort()
          }
        },
      })
    } else {
      router.clearModals()

      thunk = publishThunk({relays, event: signedEvent, delay: $userSettings.send_delay})
    }

    new Promise<void>(resolve => {
      thunk.subscribe(t => {
        if (thunkIsComplete(t)) {
          resolve()
        }
      })
    }).then(() => {
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
          drafts.set(DRAFT_KEY, editor.getJSON())
        },
      })
    }

    if (!aborted) {
      showPublishInfo(thunk)
      broadcastUserRelays(relays)
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
      drafts.set(DRAFT_KEY, editor.getJSON())
    },
    onUploadError: task => showWarning(`Failed to upload file: ${task.error}`),
    uploading,
    charCount,
    wordCount,
  })

  let showPreview = false
  let showOptions = false
  let publishing: "signing" | "pow"
  let pow: ProofOfWork
  let options: Values = {
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
    } else if (
      pubkey &&
      pubkey !== $session.pubkey &&
      !editor.getText({blockSeparator: "\n"}).trim()
    ) {
      editor.commands.insertNProfile({bech32: pubkeyEncoder.encode(pubkey)})
    }

    setTimeout(() => editor.commands.focus("end"))

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
          <button
            type="button"
            on:click={pollEnabled ? removePoll : addPoll}
            class="cursor-pointer text-sm underline">
            <i class="fa fa-plus" />
            {pollEnabled ? "Remove poll options" : "Add poll options"}
          </button>
          <span>•</span>
          <button type="button" on:click={togglePreview} class="cursor-pointer text-sm underline">
            {showPreview ? "Hide" : "Show"} Preview
          </button>
          <button type="button" on:click={openOptions} class="cursor-pointer text-sm">
            <i class="fa fa-cog" />
          </button>
        </div>
      </Field>
      {#if pollEnabled}
        <Field icon="fa-square-poll-horizontal" label="Poll">
          <FlexColumn small>
            {#each pollOptions as option, i (option.id)}
              <div class="flex items-center gap-2">
                <Input
                  class="flex-grow"
                  bind:value={option.value}
                  placeholder={`Option ${i + 1}`}
                  on:keydown={onPollOptionKeydown} />
                <Button
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-neutral-700 text-neutral-100 transition-colors hover:bg-neutral-600"
                  on:click={() => removePollOption(option.id)}>
                  <i class="fa fa-times" />
                </Button>
              </div>
            {/each}
            <button
              type="button"
              on:click={addPollOption}
              class="flex cursor-pointer items-center gap-2 self-start text-sm">
              <i class="fa fa-plus" />
              <span class="underline">Add option</span>
            </button>
          </FlexColumn>
        </Field>
        <FieldInline label="Allow multiple selections">
          <Toggle bind:value={multipleChoice} />
        </FieldInline>
      {/if}
      <div class="flex gap-2">
        <Button
          type="submit"
          class="btn btn-accent flex-grow"
          loading={$uploading || Boolean(publishing)}>
          {#if $uploading || !!publishing}
            {#if publishing === "signing"}
              Signing your note...
            {:else if publishing === "pow"}
              Generating Work...
            {:else}
              Uploading media...
            {/if}
          {:else if options?.publish_at && dateToSeconds(options.publish_at) > now()}
            Schedule
          {:else}
            Send
          {/if}
        </Button>
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
