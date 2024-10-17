<script lang="ts">
  import {join, identity} from "ramda"
  import {writable} from "svelte/store"
  import {ctx} from "@welshman/lib"
  import {Tags, createEvent} from "@welshman/util"
  import {pubkey, tagReplyTo} from "@welshman/app"
  import {showWarning, showPublishInfo} from "src/partials/Toast.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import AltColor from "src/partials/AltColor.svelte"
  import NsecWarning from "src/app/shared/NsecWarning.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import NoteOptions from "src/app/shared/NoteOptions.svelte"
  import NoteImages from "src/app/shared/NoteImages.svelte"
  import GroupLink from "src/app/shared/GroupLink.svelte"
  import {env, publish, getClientTags, tagsFromContent, publishToZeroOrMoreGroups} from "src/engine"

  export let parent = null
  export let group = null

  if (parent && group) {
    throw new Error("Either parent or group is allowed, not both")
  }

  const defaultGroups = env.FORCE_GROUP
    ? [env.FORCE_GROUP]
    : parent
      ? Tags.fromEvent(parent).context().values().valueOf()
      : [group].filter(identity)

  const defaultOpts = {anonymous: false, warning: ""}

  let images, compose, options, saving

  let opts = {...defaultOpts}

  const setOpts = e => {
    opts = {...opts, ...e.detail}
  }

  const nsecWarning = writable(null)

  const bypassNsecWarning = () => {
    nsecWarning.set(null)
    onSubmit({skipNsecWarning: true})
  }

  const onSubmit = async ({skipNsecWarning = false} = {}) => {
    saving = true

    const content = compose.parse().trim()

    if (!content) return showWarning("Please provide a description.")

    if (!skipNsecWarning && content.match(/\bnsec1.+/)) return nsecWarning.set(true)

    const tags = [...tagsFromContent(content), ...getClientTags()]

    if (parent) {
      for (const tag of tagReplyTo(parent)) {
        tags.push(tag)
      }
    }

    for (const imeta of images.getValue()) {
      tags.push(["imeta", ...imeta.unwrap().map(join(" "))])
    }

    if (opts.warning) {
      tags.push(["content-warning", opts.warning])
    }

    // Re-broadcast the note we're replying to
    if (parent && !parent.wrap) {
      publish({event: parent, relays: ctx.app.router.PublishEvent(parent).getUrls()})
    }

    const template = createEvent(1, {content, tags})
    const {pubs} = await publishToZeroOrMoreGroups(defaultGroups, template, opts)

    showPublishInfo(pubs[0])
    opts = {...defaultOpts}
    compose.clear()
    saving = false
  }
</script>

<form on:submit|preventDefault={() => onSubmit()}>
  <AltColor background class="z-feature flex gap-4 overflow-hidden rounded p-3 text-neutral-100">
    <PersonCircle class="h-10 w-10" pubkey={$pubkey} />
    <div class="w-full min-w-0">
      <Compose placeholder="What's up?" bind:this={compose} {onSubmit} style="min-height: 3em;" />
      <div class="p-2">
        <NoteImages bind:this={images} bind:compose includeInContent />
      </div>
      <div class="flex items-center justify-between">
        <div class="flex items-center justify-end gap-3">
          <i class="fa fa-cog cursor-pointer" on:click={() => options.setView("settings")} />
          <ImageInput multi hostLimit={3} on:change={e => images.addImage(e.detail)} {compose}>
            <i slot="button" class="fa fa-paperclip cursor-pointer" />
          </ImageInput>
          {#if group}
            <Popover triggerType="mouseenter">
              <i slot="trigger" class="fa fa-circle-nodes cursor-pointer" />
              <div slot="tooltip">
                Posting to <GroupLink address={group} />
              </div>
            </Popover>
          {/if}
        </div>
        <Anchor button accent disabled={saving} on:click={() => onSubmit()}>Send</Anchor>
      </div>
    </div>
  </AltColor>
</form>

<NoteOptions on:change={setOpts} bind:this={options} initialValues={opts} hideFields={["groups"]} />

{#if $nsecWarning}
  <NsecWarning onAbort={() => nsecWarning.set(null)} onBypass={bypassNsecWarning} />
{/if}
