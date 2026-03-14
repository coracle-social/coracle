<script lang="ts">
  import {_} from "svelte-i18n"
  import {session} from "@welshman/app"
  import {normalizeRelayUrl} from "@welshman/util"
  import PersonList from "src/app/shared/PersonList.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import Onboarding from "src/app/views/Onboarding.svelte"
  import Link from "src/partials/Link.svelte"
  import Card from "src/partials/Card.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import {updateIn} from "src/util/misc"

  export let people = []
  export let relays = []

  const parsedRelays = relays
    .map(s => ({url: s.split("|")[0], claim: s.split("|")[1]}))
    .map(updateIn("url", normalizeRelayUrl))
</script>

{#if $session}
  <div class="mb-4 flex flex-col items-center justify-center">
    <Heading>{$_("inviteAccept.title")}</Heading>
    <p>
      {$_("inviteAccept.description")}
    </p>
  </div>
  {#if people.length > 0}
    <Card>
      <FlexColumn>
        <Subheading>{$_("inviteAccept.people")}</Subheading>
        <p>{$_("inviteAccept.peopleDescription")}</p>
        <PersonList pubkeys={people} />
      </FlexColumn>
    </Card>
  {/if}
  {#if parsedRelays.length > 0}
    <Card>
      <FlexColumn>
        <Subheading>{$_("inviteAccept.relays")}</Subheading>
        <p>{$_("inviteAccept.relaysDescription")}</p>
        <div class="grid grid-cols-1 gap-4">
          {#each parsedRelays as relay (relay.url)}
            <RelayCard url={relay.url} claim={relay.claim} />
          {/each}
        </div>
      </FlexColumn>
    </Card>
  {/if}
  <Link class="btn btn-accent" href="/">{$_("inviteAccept.done")}</Link>
{:else}
  <Onboarding invite={{people, relays, parsedRelays}} />
{/if}
