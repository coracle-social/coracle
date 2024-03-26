import {collection} from "@coracle.social/lib"
import type {Group, GroupKey, GroupRequest, GroupAlert} from "./model"

export const groups = collection<Group>("address")
export const groupAdminKeys = collection<GroupKey>("pubkey")
export const groupSharedKeys = collection<GroupKey>("pubkey")
export const groupRequests = collection<GroupRequest>("id")
export const groupAlerts = collection<GroupAlert>("id")
