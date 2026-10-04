import { readFile } from 'node:fs/promises'

const copy = JSON.parse(await readFile(new URL('../src/client/deskpet/config/copy.json', import.meta.url), 'utf8'))
const behavior = JSON.parse(await readFile(new URL('../src/client/deskpet/config/behavior.json', import.meta.url), 'utf8'))
const client = await readFile(new URL('../src/client/index.ts', import.meta.url), 'utf8')
const overlay = await readFile(new URL('../src/client/deskpet/view/overlay.ts', import.meta.url), 'utf8')
const allText = [...copy.idleBubbles.map((entry) => entry.text), copy.grab, copy.cry, copy.top, ...Object.values(copy.landing), copy.poke, copy.pokeVariant, copy.sleep, copy.wake, copy.thoughtPrefix, copy.thoughtSuffix]
const count = (text, token) => [...text.matchAll(new RegExp(token, 'g'))].length
const errors = []
if (behavior.environment.composerSelector !== '[data-composer-card]' || behavior.environment.composerInputSelector !== '[data-composer-card] textarea') errors.push('deskpet must anchor to the dsh main composer')
for (const marker of ['data-dsh-dafeiyu-entry', 'dfy-dock', 'data-composer-card', 'textarea']) if (!client.includes(marker)) errors.push('bubble chat marker missing: ' + marker)
if (!overlay.includes('document.body.appendChild(host)')) errors.push('deskpet host must use viewport coordinates')
if (client.includes('dfy-panel') || client.includes('dfy-compose') || client.includes('dfy-input') || client.includes('dfy-quick')) errors.push('legacy panel UI must not return')
if (overlay.includes('放到桌面上') || overlay.includes('dafeiyu-deskpet-toggle')) errors.push('visible deskpet toggle must not be present')
if (count(allText.join('\n'), '测完叫我') !== copy.constraints['测完叫我']) errors.push('测完叫我 count mismatch')
if (count(allText.join('\n'), '千问') !== copy.constraints['千问']) errors.push('千问 count mismatch')
for (const entry of copy.idleBubbles) if ([...entry.text].length > copy.constraints.idleBubbleMaxLength) errors.push('idle bubble too long: ' + entry.id)
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('deskpet copy constraints passed')
