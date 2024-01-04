<script lang="ts">
  import {join, identity} from "ramda"
  import {createEvent} from "paravel"
  import {toast} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import AlternatingBackground from "src/partials/AlternatingBackground.svelte"
  import NsecWarning from "src/app/shared/NsecWarning.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import NoteOptions from "src/app/shared/NoteOptions.svelte"
  import NoteImages from "src/app/shared/NoteImages.svelte"
  import GroupLink from "src/app/shared/GroupLink.svelte"
  import {toastProgress} from "src/app/state"
  import {router} from "src/app/router"
  import {
    pubkey,
    writable,
    getClientTags,
    publishToZeroOrMoreGroups,
    getGroupPublishHints,
  } from "src/engine"

  export let group = null

  const defaultGroups = [group].filter(identity)
  const defaultOpts = {
    warning: "",
    relays: getGroupPublishHints(defaultGroups),
    groups: defaultGroups,
    shouldWrap: true,
    anonymous: false,
  }

  let images, compose, options

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
    const tags = getClientTags()
    const content = compose.parse().trim()

    if (!content) return toast.show("error", "Please provide a description.")

    if (!skipNsecWarning && content.match(/\bnsec1.+/)) return nsecWarning.set(true)

    for (const imeta of images.getValue()) {
      tags.push(["imeta", ...imeta.all().map(join(" "))])
    }

    if (opts.warning) {
      tags.push(["content-warning", opts.warning])
    }

    const template = createEvent(1, {content, tags})

    const {pubs} = await publishToZeroOrMoreGroups(opts.groups, template, opts)

    pubs[0].on("progress", toastProgress)

    opts = {...defaultOpts}

    compose.clear()
  }
</script>

<form on:submit|preventDefault={() => onSubmit()}>
  <AlternatingBackground class="z-feature overflow-hidden rounded p-3">
    <div class="flex gap-4 text-lightest">
      <PersonCircle class="w-10 h-10" pubkey={$pubkey} />
      <div class="w-full">
        <Compose placeholder="What's up?" bind:this={compose} {onSubmit} style="min-height: 3em;" />
        <div class="p-2">
          <NoteImages bind:this={images} bind:compose includeInContent />
        </div>
        <div class="flex justify-between items-center">
          <div class="flex items-center justify-end gap-3">
            <i class="fa fa-cog cursor-pointer" on:click={() => options.setView("settings")} />
            <ImageInput multi hostLimit={3} on:change={e => images.addImage(e.detail)}>
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
          <Anchor button accent on:click={onSubmit}>Send</Anchor>
        </div>
      </div>
    </div>
  </AlternatingBackground>
</form>

<NoteOptions
  on:change={setOpts}
  bind:this={options}
  initialValues={opts}
  hideFields={["relays", "groups"]} />

{#if $nsecWarning}
  <NsecWarning onAbort={() => nsecWarning.set(null)} onBypass={bypassNsecWarning} />
{/if}
