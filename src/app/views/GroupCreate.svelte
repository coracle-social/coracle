<script lang="ts">
  import {pluck} from "ramda"
  import Card from "src/partials/Card.svelte"
  import Heading from "src/partials/Heading.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import type {Values} from "src/app/shared/GroupDetailsForm.svelte"
  import GroupDetailsForm from "src/app/shared/GroupDetailsForm.svelte"
  import {
    user,
    initGroup,
    publishGroupMeta,
    publishGroupInvites,
    publishAdminKeyShares,
    publishCommunityMeta,
    publishCommunitiesList,
    publishGroupMembers,
    deriveUserCommunities,
  } from "src/engine"
  import {router} from "src/app/router"

  const initialValues = {
    type: null,
    relays: [],
    members: [$user],
    list_publicly: false,
    meta: {
      name: "",
      about: "",
      picture: "",
      banner: "",
    },
  }

  const setType = type => {
    initialValues.type = type
  }

  const onSubmit = async ({type, relays, members, list_publicly, meta}: Values) => {
    const kind = type === "open" ? 34550 : 35834
    const memberPubkeys = pluck("pubkey", members)
    const {id, address} = initGroup(kind, relays)

    await publishAdminKeyShares(address, [$user.pubkey], relays)

    if (type === "open") {
      await publishCommunityMeta(address, id, relays, meta)
      await publishCommunitiesList(deriveUserCommunities().get().concat(address))
    } else {
      await publishGroupMeta(address, id, relays, meta, list_publicly)
      await publishGroupInvites(address, memberPubkeys, relays)
      await publishGroupMembers(address, "set", memberPubkeys)
    }

    router.at("groups").of(address).at("notes").replace()
  }
</script>

{#if !initialValues.type}
  <div class="mb-4 flex flex-col items-center justify-center">
    <Heading>Create Group</Heading>
    <p>What type of group would you like to create?</p>
  </div>
  <Card interactive on:click={() => setType("open")}>
    <FlexColumn>
      <div class="flex items-center justify-between">
        <p class="flex items-center gap-4 text-xl">
          <i class="fa fa-unlock text-neutral-600" />
          <strong>Open</strong>
        </p>
        <i class="fa fa-arrow-right" />
      </div>
      <p>
        Anyone can participate in an open group. All content is public, although some clients will
        allow you to assign moderators and selectively show only certain content.
      </p>
    </FlexColumn>
  </Card>
  <Card interactive on:click={() => setType("closed")}>
    <FlexColumn>
      <div class="flex items-center justify-between">
        <p class="flex items-center gap-4 text-xl">
          <i class="fa fa-lock text-neutral-600" />
          <strong>Closed</strong>
        </p>
        <i class="fa fa-arrow-right" />
      </div>
      <p>
        Messages posted to a closed group are encrypted so that only other members can see them.
        Only people you approve can join a closed group.
      </p>
    </FlexColumn>
  </Card>
{:else}
  <div class="relative">
    <i
      class="fa fa-2x fa-arrow-left absolute top-12 cursor-pointer"
      on:click={() => setType(null)} />
    <GroupDetailsForm
      {onSubmit}
      values={initialValues}
      showMembers={initialValues.type === "closed"}
      buttonText={`Create ${initialValues.type} group`} />
  </div>
{/if}
