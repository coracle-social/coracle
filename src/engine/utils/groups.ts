import {ellipsize} from "hurdak"
import {decodeAddress, addressToNaddr} from "@welshman/util"
import type {Group} from "src/engine/model"

export const getGroupNaddr = (group: Group) =>
  addressToNaddr(decodeAddress(group.address, group.relays))

export const getGroupId = (group: Group) => group.address.split(":").slice(2).join(":")

export const getGroupName = (group: Group) => group.meta?.name || group.id || ""

export const displayGroup = (group: Group) => ellipsize(group ? getGroupName(group) : "No name", 60)
