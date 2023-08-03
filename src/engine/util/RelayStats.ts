import {add, inc, dec} from "ramda"
import {Socket} from "paravel"
import {now} from "src/util/misc"
import {info} from "src/util/logger"
import {switcherFn} from "hurdak"
import type {Engine} from "src/engine/Engine"

const getQuality = socket => {
  if (socket.meta.error === "unauthorized") return [0.3, "Logging in"]
  if (socket.meta.error === "forbidden") return [0, "Failed to log in"]
  if (socket.status === Socket.STATUS.ERROR) return [0, "Failed to connect"]
  if (socket.status === Socket.STATUS.CLOSED) return [0.5, "Waiting to reconnect"]
  if (socket.status === Socket.STATUS.PENDING) return [0.5, "Establishing connection"]

  if (socket.meta.eose_count > 0) {
    const quality = Math.max(1, 500 / (socket.meta.eose_timer / socket.meta.eose_count))

    return [quality, quality < 0.7 ? "Slow connection" : "Connected"]
  }

  return socket.status === Socket.STATUS.READY ? [1, "Connected"] : [0.5, "Not connected"]
}

const setMeta = (socket, meta) => {
  socket.meta = {
    error: null,
    last_opened: null,
    last_closed: 0,
    last_activity: 0,
    total_subs: 0,
    active_subs: 0,
    events_count: 0,
    eose_count: 0,
    eose_timer: 0,
    ...socket.meta,
    ...meta,
  }

  const [quality, description] = getQuality(socket)

  socket.meta.quality = quality
  socket.meta.description = description
}

export class RelayStats {
  engine: Engine

  constructor(engine: Engine) {
    this.engine = engine

    this.engine.Network.pool.on("init", socket => {
      const eose = new Map()
      const subs = new Map()

      setMeta(socket, {})

      const onSend = (_, [verb, ...payload]) => {
        switcherFn(verb, {
          EVENT: () =>
            setMeta(socket, {
              last_activity: now(),
            }),
          REQ: () => {
            const subid = payload[0]

            eose.set(subid, Date.now())
            subs.set(subid, payload)

            setMeta(socket, {
              last_activity: now(),
              total_subs: inc(socket.meta.total_subs || 0),
              active_subs: inc(socket.meta.active_subs || 0),
            })
          },
          CLOSE: () => {
            const subid = payload[0]

            eose.delete(subid)
            subs.delete(subid)

            setMeta(socket, {
              last_activity: now(),
              active_subs: dec(socket.meta.active_subs || 0),
            })
          },
          default: () => null,
        })
      }

      const onReceive = (_, [verb, ...payload]) => {
        switcherFn(verb, {
          EVENT: () =>
            setMeta(socket, {
              last_activity: now(),
              events_count: inc(socket.meta.events_count || 0),
            }),
          EOSE: () => {
            const subid = payload[1]
            const ms = Date.now() - eose.get(subid) || 0

            eose.delete(subid)
            subs.delete(subid)

            setMeta(socket, {
              last_activity: now(),
              eose_count: inc(socket.meta.eose_count || 0),
              eose_timer: add(socket.meta.eose_timer || 0, ms),
            })
          },
          ERROR: () => setMeta(socket, {error: "failed to publish"}),
          AUTH: () => setMeta(socket, {error: "unauthorized"}),
          OK: () => setMeta(socket, {error: null}),
          default: () => null,
        })
      }

      socket.on("open", () => {
        setMeta(socket, {last_opened: now(), last_activity: now()})

        socket.on("send", onSend)
        socket.on("receive", onReceive)
      })

      socket.on("close", () => {
        setMeta(socket, {
          active_subs: 0,
          last_closed: now(),
          last_activity: now(),
        })

        socket.off("send", onSend)
        socket.off("receive", onReceive)

        // If we didn't purposely remove the socket and it's healthy, restart
        // and re-send active subcriptions
        if (
          this.engine.Network.pool.has(socket.url) &&
          socket.status !== Socket.STATUS.ERROR &&
          !socket.meta.error
        ) {
          if (subs.size > 0) {
            info(`Resuming ${subs.size} subscriptions on ${socket.url}`)
          }

          for (const payload of subs.values()) {
            socket.send(payload)
          }
        }
      })
    })
  }
}
