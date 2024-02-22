<script lang="ts">
  import {normalizeRelayUrl} from "paravel"
  import Card from "src/partials/Card.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import PersonList from "src/app/shared/PersonList.svelte"
  import GroupListItem from "src/app/shared/GroupListItem.svelte"
  import GroupActions from "src/app/shared/GroupActions.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import Onboarding from "src/app/views/Onboarding.svelte"
  import {env, session} from "src/engine"

  export let invite

  const relays =
    $env.FORCE_RELAYS.length > 0
      ? invite.relays.filter(r => $env.FORCE_RELAYS.includes(normalizeRelayUrl(r.url)))
      : invite.relays
</script>

{#if $session}
  <div class="mb-4 flex flex-col items-center justify-center">
    <Heading>You've been invited</Heading>
    <p>
      You've been sent a nostr invite link! Take a look below to find some suggestions to improve
      your experience on nostr.
    </p>
  </div>
  {#if invite.people.length > 0}
    <Card>
      <FlexColumn>
        <Subheading>People</Subheading>
        <p>Here are some people you might be interested in following.</p>
        <PersonList pubkeys={invite.people} />
      </FlexColumn>
    </Card>
  {/if}
  {#if relays.length > 0}
    <Card>
      <FlexColumn>
        <Subheading>Relays</Subheading>
        <p>Below are a few relays that might help you connect to the people you want to reach.</p>
        <div class="grid grid-cols-1 gap-4">
          {#each relays as relay (relay.url)}
            <RelayCard {relay} claim={relay.claim} />
          {/each}
        </div>
      </FlexColumn>
    </Card>
  {/if}
  {#if invite.groups.length > 0}
    <Card>
      <FlexColumn>
        <Subheading>Groups</Subheading>
        <p>Here is a selection of groups you might be interested in.</p>
        {#each invite.groups as group (group.address)}
          <GroupListItem modal address={group.address}>
            <div slot="actions">
              <GroupActions address={group.address} claim={group.claim} />
            </div>
          </GroupListItem>
        {/each}
      </FlexColumn>
    </Card>
  {/if}
  <Anchor button accent href="/">Done</Anchor>
{:else}
  <Onboarding {invite} />
{/if}
