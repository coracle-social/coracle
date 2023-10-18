<script lang="ts">
  import {pluck, assoc, uniq, without} from "ramda"
  import {quantify, difference} from "hurdak"
  import {toast} from "src/partials/state"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
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
    publishGroupMeta,
  } from "src/engine"
  import {router} from "src/app/router"

  export let address
  export let addMembers = []
  export let removeMembers = []

  const group = groups.key(address)
  const adminKey = deriveAdminKeyForGroup(address)
  const initialMembers = uniq(without(removeMembers, [...$adminKey.members, ...addMembers]))

  const onSubmit = () => {
    initSharedKey(address)

    const newMembers = pluck("pubkey", members)
    const removedMembers = Array.from(difference(new Set(initialMembers), new Set(newMembers)))
    const gracePeriod = graceHours * 60 * 60

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

    // Send new invites
    publishGroupInvites(address, newMembers, gracePeriod)

    // Send evictions
    publishGroupEvictions(address, removedMembers, gracePeriod)

    // Re-publish group info
    publishGroupMeta(address, $group)

    toast.show("info", "Invites have been sent!")
    router.pop()
  }

  let graceHours = 24
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
    <Field label="Grace Period">
      <div slot="display">{quantify(graceHours, "hour")}</div>
      <Input type="range" bind:value={graceHours} min={0} max={72} />
      <div slot="info">Set how long the old key will still be valid for posting to the group.</div>
    </Field>
    <Anchor tag="button" theme="button" type="submit" class="text-center">Save</Anchor>
  </Content>
</form>
