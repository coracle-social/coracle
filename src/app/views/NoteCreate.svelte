<script lang="ts">
  import {onMount} from "svelte"
  import {nip19} from "nostr-tools"
  import {without, identity, prop, uniqBy} from "ramda"
  import {throttle, quantify} from "hurdak"
  import {createEvent, Tags} from "paravel"
  import {annotateMedia} from "src/util/misc"
  import {asNostrEvent} from "src/util/nostr"
  import Anchor from "src/partials/Anchor.svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import Media from "src/partials/Media.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import NoteOptions from "src/app/shared/NoteOptions.svelte"
  import {Publisher, mention} from "src/engine"
  import {toastProgress} from "src/app/state"
  import {router} from "src/app/router"
  import {
    session,
    getEventHints,
    displayGroup,
    groups,
    getUserRelayUrls,
    publishToZeroOrMoreGroups,
    deriveMembershipLevel,
  } from "src/engine"

  export let quote = null
  export let pubkey = null
  export let group = null

  let images = []
  let compose = null
  let wordCount = 0
  let showPreview = false
  let defaultGroups = quote ? Tags.from(quote).communities().all() : [group].filter(identity)
  let options
  let opts = {
    warning: "",
    groups: defaultGroups,
    relays: getUserRelayUrls("write"),
    shouldWrap: true,
    anonymous: false,
  }

  const setOpts = e => {
    opts = {...opts, ...e.detail}
  }

  const groupOptions = session.derived($session => {
    const options = []

    for (const address of Object.keys($session.groups || {})) {
      const group = groups.key(address).get()

      if (group && deriveMembershipLevel(address).get()) {
        options.push(group)
      }
    }

    for (const address of defaultGroups) {
      options.push({address})
    }

    return uniqBy(prop("address"), options)
  })

  const onSubmit = async () => {
    const tags = []
    const content = compose.parse().trim()

    if (!content) {
      return
    }

    if (opts.warning) {
      tags.push(["content-warning", opts.warning])
    }

    if (quote) {
      tags.push(mention(quote.pubkey))

      // Re-broadcast the note we're quoting
      if (!opts.groups.length) {
        Publisher.publish({
          relays: opts.relays,
          event: asNostrEvent(quote),
        })
      }
    }

    const template = createEvent(1, {content, tags})
    const pubs = await publishToZeroOrMoreGroups(opts.groups, template, opts)

    pubs[0].on("progress", toastProgress)

    router.clearModals()
  }

  const addImage = url => {
    images = images.concat(url)
    compose.write("\n" + url)
  }

  const removeImage = url => {
    const content = compose.parse()

    compose.clear()
    compose.write(content.replace(url, ""))

    images = without([url], images)
  }

  const togglePreview = () => {
    showPreview = !showPreview
  }

  const setWordCount = throttle(300, () => {
    if (compose) {
      wordCount = compose.parse().match(/\s+/g)?.length || 0
    }
  })

  onMount(() => {
    if (pubkey && pubkey !== $session.pubkey) {
      compose.mention(pubkey)
    }

    if (quote) {
      const nevent = nip19.neventEncode({id: quote.id, relays: getEventHints(quote)})

      compose.nevent("nostr:" + nevent)
    }
  })
</script>

<form on:submit|preventDefault={onSubmit}>
  <Content size="lg">
    <Heading class="text-center">Create a note</Heading>
    <div class="flex w-full flex-col gap-4">
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <strong>What do you want to say?</strong>
          {#if $groupOptions.length > 0}
            <div
              class="flex items-center gap-2"
              class:cursor-pointer={!quote?.group}
              on:click={quote?.group ? null : options.setView("groups")}>
              <i class="fa fa-circle-nodes" />
              {#if opts.groups.length === 1}
                {displayGroup(groups.key(opts.groups[0]).get())}
              {:else if opts.groups.length > 1}
                {quantify(opts.groups.length, "group")}
              {/if}
            </div>
          {/if}
        </div>
        <div
          class="mt-4 rounded-xl border border-solid border-gray-6 p-3"
          class:bg-input={!showPreview}
          class:text-black={!showPreview}
          class:bg-gray-7={showPreview}>
          {#if showPreview}
            <NoteContent note={{content: compose.parse(), tags: []}} />
          {/if}
          <div class:hidden={showPreview}>
            <Compose on:keyup={setWordCount} bind:this={compose} {onSubmit} />
          </div>
        </div>
        <div class="flex items-center justify-end gap-2 text-gray-5">
          <small class="hidden sm:block">
            {wordCount} words
          </small>
          <span>•</span>
          <small on:click={togglePreview} class="cursor-pointer underline">
            {showPreview ? "Hide" : "Show"} Preview
          </small>
        </div>
      </div>
      {#if images.length > 0}
        <div class="columns-2 gap-2 lg:columns-3">
          {#each images as url}
            <div class="mb-2">
              <Media link={annotateMedia(url)} onClose={() => removeImage(url)} />
            </div>
          {/each}
        </div>
      {/if}
      <div class="flex gap-2">
        <Anchor tag="button" theme="button" type="submit" class="flex-grow text-center"
          >Send</Anchor>
        <ImageInput multi onChange={addImage} />
      </div>
      <small
        class="flex cursor-pointer items-center justify-end gap-4"
        on:click={() => options.setView("settings")}>
        {#if opts.anonymous}
          <span><i class="fa fa-user-secret" /></span>
          <span>•</span>
        {/if}
        <span><i class="fa fa-server" /> {opts.relays?.length}</span>
        <span><i class="fa fa-warning" /> {opts.warning || 0}</span>
      </small>
    </div>
  </Content>
</form>

<NoteOptions
  bind:this={options}
  on:change={setOpts}
  initialValues={opts}
  groupOptions={$groupOptions} />
