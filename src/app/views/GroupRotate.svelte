<script lang="ts">
  import {pluck, assoc, uniq, without} from "ramda"
  import {difference} from "hurdak"
  import {toast} from "src/partials/state"
  import Field from "src/partials/Field.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import PersonMultiSelect from "src/app/shared/PersonMultiSelect.svelte"
  import type {GroupRequest} from "src/engine"
  import {
    people,
    groups,
    groupRequests,
    initSharedKey,
    deriveAdminKeyForGroup,
    groupAdminKeys,
    publishGroupInvites,
    publishGroupEvictions,
    publishGroupMembers,
    publishGroupMeta,
    GroupAccess,
  } from "src/engine"
  import {router} from "src/app/router"

  export let address
  export let addMembers = []
  export let removeMembers = []

  const group = groups.key(address)
  const adminKey = deriveAdminKeyForGroup(address)
  const initialMembers = uniq(without(removeMembers, [...$group.members, ...addMembers]))

  const onSubmit = () => {
    if (!soft) {
      initSharedKey(address)
    }

    const newMembers = pluck("pubkey", members)
    const removedMembers = Array.from(difference(new Set(initialMembers), new Set(newMembers)))

    // Update our authoritative member list
    groupAdminKeys.key($adminKey.pubkey).update(assoc("members", newMembers))

    // Clear any requests
    groupRequests.update($requests => {
      return $requests.map((r: GroupRequest) => {
        if (r.group !== address) {
          return r
        }

        if (r.kind === 25 && newMembers.includes(r.pubkey)) {
          return {...r, resolved: true}
        }

        if (r.kind === 26 && !newMembers.includes(r.pubkey)) {
          return {...r, resolved: true}
        }

        return r
      })
    })

    // Add members
    if (newMembers.length > 0) {
      publishGroupMembers(address, "add", newMembers)
      publishGroupInvites(address, newMembers, $group.relays)
    }

    // Remove members
    if (removedMembers.length > 0) {
      publishGroupMembers(address, "remove", removedMembers)
      publishGroupEvictions(address, removedMembers)
    }

    // Re-publish group info
    if ($group.access !== GroupAccess.Open) {
      publishGroupMeta(address, false, $group)
    }

    toast.show("info", "Invites have been sent!")
    router.pop()
  }

  let soft = false
  let members = people.mapStore
    .derived(m => initialMembers.map(pubkey => m.get(pubkey) || {pubkey}))
    .get()
</script>

<form on:submit|preventDefault={onSubmit}>
  <Content size="lg">
    <Heading class="text-center">Rotate Keys</Heading>
    <p class="text-center">
      Rotate keys periodically to change group membership and increase security.
    </p>
    <Field label="Member List">
      <PersonMultiSelect bind:value={members} />
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
