# Nordic Dub Stack 2.4

Eight Nordic sound systems, one cabinet at a time. Build each stack from the bass cabinets up, with a four-way preamp that opens the music bands as correctly placed cabinets are added. Version 2.3 refined the mobile layout and effects. Version 2.4 scales the game stage and condenses the desktop side panels so the full game fits more comfortably on a standard monitor.

## Play

Open `index.html` in a browser and press **String up the sound**. The attached dubplate loops in the background. Browsers require a click before they allow audio playback.

- **← / →** move a cabinet. **↓** lowers it. **Space** drops it.
- **P** pauses or resumes.
- **S** triggers the dub siren. **H** triggers the air horn.
- Music and sound effects have separate controls.

The music starts with the bass range (30–100 Hz). Correctly placed kicks add 100–200 Hz, mids add 200 Hz–5 kHz, and tops or tweeters open the high band above 5 kHz. The preamp lamps show which bands are active. Each rig resets to bass when the next stack begins.

## Host it

Keep `index.html`, the JavaScript and CSS files, and the `assets/` folder together in your web server's public directory. If the game is served from a Docker bind mount, copy the contents of this folder into the existing mounted directory and keep its current container and port.

The soundtrack is `assets/soundsystem-culture-dan-i-locks-10000-lions-dubplate.mp3` and loops automatically. Dub siren and air horn effects are synthesised in the browser.

## Artwork and music

Cabinet artwork comes from the illustration *Nordisk ljudsystemskultur i åtta staplar*. The Ivah Sound wordmark and fonts are from [ivahsound.com](https://ivahsound.com/); font licences are in `assets/fonts/`. The soundtrack is the user-provided dubplate **Soundsystem Culture – Dan I Locks & 10 000 Lions – dubplate**.
