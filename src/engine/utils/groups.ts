import {ellipsize} from "hurdak"
import {Address} from "@welshman/util"
import type {Group} from "src/engine/model"

export const getGroupNaddr = (group: Group) => Address.from(group.address, group.relays).toNaddr()

export const getGroupId = (group: Group) => group.address.split(":").slice(2).join(":")

export const getGroupName = (group: Group) => group.meta?.name || group.id || ""

export const displayGroup = (group: Group) => ellipsize(group ? getGroupName(group) : "No name", 60)
