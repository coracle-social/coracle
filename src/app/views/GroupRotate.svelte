<script lang="ts">
  import {without} from "ramda"
  import {difference} from "hurdak"
  import {showInfo} from "src/partials/Toast.svelte"
  import Field from "src/partials/Field.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import PersonSelect from "src/app/shared/PersonSelect.svelte"
  import type {GroupRequest} from "src/engine"
  import {
    groups,
    groupRequests,
    initSharedKey,
    publishGroupInvites,
    publishGroupEvictions,
    publishGroupMembers,
    publishGroupMeta,
  } from "src/engine"
  import {router} from "src/app/util/router"

  export let address
  export let addMembers = []
  export let removeMembers = []

  const group = groups.key(address)
  const initialMembers = new Set(
    without(removeMembers, [...($group?.members || []), ...addMembers]),
  )

  const onSubmit = () => {
    if (!soft) {
      initSharedKey(address)
    }

    const allMembers = new Set(members)
    const addedMembers = difference(allMembers, initialMembers)
    const removedMembers = difference(initialMembers, allMembers)

    // Clear any requests
    groupRequests.update($requests => {
      return $requests.map((r: GroupRequest) => {
        if (r.group !== address) {
          return r
        }

        if (r.kind === 25 && allMembers.has(r.pubkey)) {
          return {...r, resolved: true}
        }

        if (r.kind === 26 && !allMembers.has(r.pubkey)) {
          return {...r, resolved: true}
        }

        return r
      })
    })

    // Add members

    // Notify existing members of new shared key if needed, send full member list if we're rotating
    if (soft) {
      if (addedMembers.size > 0) {
        publishGroupMembers(address, "add", Array.from(addedMembers))
      }

      if (removedMembers.size > 0) {
        publishGroupMembers(address, "remove", Array.from(removedMembers))
      }
    } else {
      publishGroupMembers(address, "set", Array.from(allMembers))
    }

    // Regardless of soft/hard rotate, notify the people who were removed
    if (removedMembers.size > 0) {
      publishGroupEvictions(address, Array.from(removedMembers))
    }

    // Re-publish group info
    if (!soft && !$group.listing_is_public) {
      publishGroupMeta(address, $group.id, $group.feeds, $group.relays, $group.meta, false)
    }

    // Re-send invites. This could be optimized further, but it's useful to re-send to different relays.
    // It also handles edge cases, like if someone requested exit, then entry, soft rotate wouldn't let them
    // know they still have access.
    publishGroupInvites(address, allMembers)

    showInfo("Invites have been sent!")
    router.pop()
  }

  let soft = true
  let members = Array.from(initialMembers)
</script>

<form on:submit|preventDefault={onSubmit}>
  <Content size="lg">
    <Heading class="text-center">Update Members</Heading>
    <p class="text-center">
      Rotate keys periodically to change group membership and increase security.
    </p>
    <Field label="Member List">
      <PersonSelect multiple bind:value={members} />
      <div slot="info">All members will receive a fresh invitation with a new key.</div>
    </Field>
    <FieldInline label="Soft Rotate">
      <Toggle bind:value={soft} />
      <div slot="info">
        Share the current key with all new members instead of creating a new one. This allows new
        members to see recent messages, and does not revoke access for removed members.
      </div>
    </FieldInline>
    <Anchor button tag="button" type="submit">Save</Anchor>
  </Content>
</form>
