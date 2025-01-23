<script lang="ts">
  import cx from "classnames"
  import {stringToHue, hsl} from "src/util/misc"

  export let pubkey

  const hue = stringToHue(pubkey || "")
  const primary = hsl(hue, {lightness: 80})
  const secondary = hsl(hue, {saturation: 30, lightness: 40})
</script>

<div
  class="{cx(
    $$props.class,
    `flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-cover bg-center bg-neutral-800`,
  )}">
  <svg
    class="h-full w-1/2"
    width="17"
    height="20"
    viewBox="0 0 17 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color={primary}>
          <animate
            attributeName="stop-color"
            values="{primary};{secondary};{primary}"
            dur="1.6s"
            repeatCount="5" />
        </stop>
        <stop offset="100%" stop-color={secondary}>
          <animate
            attributeName="stop-color"
            values="{secondary};{primary};{secondary}"
            dur="1.8s"
            repeatCount="5" />
        </stop>
      </linearGradient>
    </defs>
    <path
      d="M16.5 16.2353C16.5 18.3145 12.9183 20 8.5 20C4.08172 20 0.5 18.3145 0.5 16.2353C0.5 14.1561 4.08172 12.4706 8.5 12.4706C12.9183 12.4706 16.5 14.1561 16.5 16.2353Z"
      fill="url(#gradient)"
      fill-opacity="0.66" />
    <path
      d="M13.3 4.70588C13.3 7.30487 11.151 9.41177 8.5 9.41177C5.84903 9.41177 3.7 7.30487 3.7 4.70588C3.7 2.1069 5.84903 0 8.5 0C11.151 0 13.3 2.1069 13.3 4.70588Z"
      fill="url(#gradient)"
      fill-opacity="0.66" />
  </svg>
</div>
