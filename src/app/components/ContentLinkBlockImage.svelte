<script lang="ts">
  import {getTags, getTagValue, tagsFromIMeta} from "@welshman/util"
  import {imgproxy} from "@app/state"

  const {value, event, ...props} = $props()

  const url = value.url.toString()
  const meta = getTags("imeta", event.tags)
    .map(tagsFromIMeta)
    .find(meta => getTagValue("url", meta) === url)
  const src = imgproxy(url)
</script>

<img alt="" {src} {...props} />
