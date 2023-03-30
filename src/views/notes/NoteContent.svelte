<script lang="ts">
  import {last, uniq, trim} from "ramda"
  import {doPipe, ellipsize} from "hurdak/lib/hurdak"
  import {extractUrls, escapeHtml} from "src/util/html"
  import {displayPerson} from "src/util/nostr"
  import Preview from "src/partials/Preview.svelte"
  import user from "src/agent/user"
  import {getPersonWithFallback} from "src/agent/tables"
  import {routes} from "src/app/ui"

  const canPreview = url => url.match("\.(jpg|jpeg|png|gif|mov|mp4)")

  export let note
  export let showEntire

  const links = uniq(extractUrls(note.content))
  const content = doPipe(note.content, [
    trim,
    escapeHtml,
    c => (showEntire || c.length < 800 ? c : ellipsize(c, 400)),
    c => {
      // Pad content with whitespace to simplify our regular expressions
      c = `<br>${c}<br>`

      for (let url of links) {
        // It's common for punctuation to end a url, trim it off
        if (url.match(/[\.\?,:]$/)) {
          url = url.slice(0, -1)
        }

        const href = url.includes("://") ? url : "https://" + url
        const display = url.replace(/(http|ws)s?:\/\/(www\.)?/, "").replace(/[\.\/?;,:]$/, "")
        const escaped = url.replace(/([.*+?^${}()|[\]\\])/g, "\\$1")
        const wsRegex = new RegExp(`<br>${escaped}<br>`, "g")
        const slashRegex = new RegExp(`\/${escaped}`, "g")

        // Skip stuff that's just at the end of a filepath
        if (c.match(slashRegex)) {
          continue
        }

        // If the url is on its own line, remove it entirely
        if (c.match(wsRegex) && canPreview(url)) {
          c = c.replace(wsRegex, '')
          continue
        }

        // Avoid matching urls inside quotes to avoid double-replacing
        const quoteRegex = new RegExp(`([^"]*)(${escaped})([^"]*)`, "g")

        const $a = document.createElement("a")

        $a.href = href
        $a.target = "_blank"
        $a.className = "underline"
        $a.innerText = ellipsize(display, 50)

        c = c.replace(quoteRegex, `$1${$a.outerHTML}$3`)
      }

      return c.trim()
    },
    // Mentions
    c =>
      c.replace(/#\[(\d+)\]/g, (tag, i) => {
        if (!note.tags[parseInt(i)]) {
          return tag
        }

        const pubkey = note.tags[parseInt(i)][1]
        const person = getPersonWithFallback(pubkey)
        const name = displayPerson(person)
        const path = routes.person(pubkey)

        return `@<a href="${path}" class="underline">${name}</a>`
      }),
  ])
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <p>{@html content}</p>
  {#if user.getSetting("showMedia") && links.length > 0}
    <button class="inline-block" on:click={e => e.stopPropagation()}>
      <Preview url={last(links)} />
    </button>
  {/if}
</div>
