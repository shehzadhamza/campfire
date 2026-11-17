/** Static campfire mark used for the favicon and PWA icons. */
export function iconSvg(bg = true): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
${bg ? '<rect width="512" height="512" rx="112" fill="#0d1424"/><circle cx="256" cy="330" r="190" fill="#ff7a2a" opacity=".18"/>' : ""}
<g transform="translate(256 400)">
  <g transform="rotate(-13)"><rect x="-150" y="-22" width="300" height="44" rx="22" fill="#5b3a24"/></g>
  <g transform="rotate(13)"><rect x="-150" y="-22" width="300" height="44" rx="22" fill="#5b3a24"/></g>
</g>
<path d="M256 70 C278 130 372 180 372 262 C372 326 320 372 256 372 C192 372 140 326 140 262 C140 180 234 130 256 70Z" fill="#ff5a1a"/>
<path d="M256 150 C272 192 330 222 330 278 C330 322 296 352 256 352 C216 352 182 322 182 278 C182 222 240 192 256 150Z" fill="#ff8a1f"/>
<path d="M256 220 C266 248 300 266 300 298 C300 324 280 344 256 344 C232 344 212 324 212 298 C212 266 246 248 256 220Z" fill="#ffc83d"/>
</svg>`;
}
