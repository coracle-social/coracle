<script lang="ts">
  import {nth} from "@welshman/lib"
  import {COMMUNITY, GROUP} from "@welshman/util"
  import Card from "src/partials/Card.svelte"
  import Heading from "src/partials/Heading.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import GroupDetailsForm from "src/app/shared/GroupDetailsForm.svelte"
  import type {GroupMeta} from "src/domain"
  import {
    env,
    pubkey,
    initGroup,
    publishGroupMeta,
    publishGroupInvites,
    publishAdminKeyShares,
    publishCommunityMeta,
    publishCommunitiesList,
    publishGroupMembers,
    deriveUserCommunities,
  } from "src/engine"
  import {router} from "src/app/util/router"

  const initialValues = {
    kind: null,
    name: "",
    about: "",
    image: "",
    banner: "",
    feeds: [],
    relays: $env.PLATFORM_RELAYS.map(url => ["relay", url]),
    listing_is_public: false,
    members: [$pubkey],
    moderators: [],
    identifier: "",
  }

  const setKind = kind => {
    initialValues.kind = kind
  }

  const onSubmit = async ({
    kind,
    members,
    listing_is_public,
    ...meta
  }: GroupMeta & {members: string[]}) => {
    const {identifier, address} = initGroup(kind, meta.relays.map(nth(1)))

    await publishAdminKeyShares(address, [$pubkey])

    if (kind === COMMUNITY) {
      await publishCommunityMeta(address, identifier, meta)
      await publishCommunitiesList(deriveUserCommunities().get().concat(address))
    } else {
      await publishGroupMeta(address, identifier, meta, listing_is_public)
      await publishGroupMembers(address, "set", members)
      await publishGroupInvites(address, members)
    }

    router.at("groups").of(address).at("notes").replace()
  }
</script>

{#if !initialValues.kind}
  <div class="mb-4 flex flex-col items-center justify-center">
    <Heading>Create Group</Heading>
    <p>What type of group would you like to create?</p>
  </div>
  <Card interactive on:click={() => setKind(COMMUNITY)}>
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
  <Card interactive on:click={() => setKind(GROUP)}>
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
      on:click={() => setKind(null)} />
    <GroupDetailsForm
      {onSubmit}
      values={initialValues}
      showMembers={initialValues.kind === GROUP}
      buttonText={initialValues.kind === GROUP ? "Create closed group" : "Create open group"} />
  </div>
{/if}
