<script lang="ts">
  import {onMount} from "svelte"
  import {noop} from "@welshman/lib"
  import {POLL_RESPONSE} from "@welshman/util"
  import {myLoad} from "src/engine"
  import {app, deriveEvents, resolveRelays} from "src/engine/core"
  import {getPollOptions, getPollRelaySelections, getPollVotersByOption} from "src/util/polls"
  import Heading from "src/partials/Heading.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import PersonList from "src/app/shared/PersonList.svelte"

  export let id

  const event = app.get().repository.getEvent(id)
  const options = event ? getPollOptions(event) : []
  const filters = [{kinds: [POLL_RESPONSE], "#e": [id]}]
  const responses = deriveEvents(filters)

  $: votersByOption = event ? getPollVotersByOption(event, $responses) : new Map<string, string[]>()

  onMount(() => {
    if (!event) return

    resolveRelays(getPollRelaySelections(event))
      .then(relays => myLoad({relays, filters}))
      .catch(noop)
  })
</script>

<FlexColumn>
  <Heading class="text-center">Votes</Heading>
  {#if options.length === 0}
    <p class="py-12 text-center">This poll has no options.</p>
  {:else}
    {#each options as option (option.id)}
      {@const voters = votersByOption.get(option.id) || []}
      <FlexColumn small>
        <div class="flex items-center justify-between gap-2">
          <strong class="text-lg">{option.label}</strong>
          <span class="whitespace-nowrap text-sm opacity-75">
            {voters.length}
            {voters.length === 1 ? "vote" : "votes"}
          </span>
        </div>
        {#if voters.length > 0}
          <PersonList pubkeys={voters} />
        {:else}
          <p class="text-sm opacity-75">No votes yet.</p>
        {/if}
      </FlexColumn>
    {/each}
  {/if}
</FlexColumn>
