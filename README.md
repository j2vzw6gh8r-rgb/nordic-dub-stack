# Nordic Dub Stack 2.1

Eight Nordic rigs, one cabinet at a time. The cabinet artwork comes from the illustration *Nordisk ljudsystemskultur i åtta staplar*. The artwork beside the stage shows the finished rig. The Ivah Sound wordmark and typography are from [ivahsound.com](https://ivahsound.com/). The font licences are included in `assets/fonts/`.

## Play

Unzip the package and open `index.html`. Choose **String up the sound** to start playing with audio.

- **← / →** move a cabinet. **↓** lowers it. **Space** drops it.
- **P** pauses or resumes the session.
- **S** triggers the dub siren. **H** triggers the air horn.
- Music and sound effects have separate controls. On smaller screens, use the buttons below the stage.

Build from the foundation up. The cabinets snap a short distance into place when you get close to an open spot. A wrong drop costs a chance and sends the same cabinet back. Clear tiers for extra points and finish the rig for a 750-point bonus. After three misses, the session ends. The eight sounds return in order with a faster tempo. Version 2 has its own local high score.

## Host it

Everything runs in the browser. Keep `index.html`, the JavaScript and CSS files, and the `assets/` folder together in your web server's public directory. It works at the root or in a subdirectory.

If the game is already served from a Docker bind mount, copy the contents of `Nordic-Dub-Stack-v2.1` into the same mounted host directory. Keep the current container and port. Reload the browser to see the updated files.

To start a new test server, run this from the unpacked folder and open `http://localhost:8080`.

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

To start a new container on port 18095, run this from the unpacked folder.

```sh
docker run -d --name nordic-dub-stack-web --restart unless-stopped \
  -p 18095:80 \
  --mount "type=bind,source=$PWD,target=/usr/share/nginx/html,readonly" \
  nginx:alpine
```

The soundtrack is `assets/soundcheck-dub.mp3`. The dub siren and air horn are synthesised in the browser.

## Cabinet references

Version 2.1 groups the driver and horn mouth into a single cabinet on the Deng Deng Hi-Fi, Roots Invasion, Rockers Ark and Lighthouse levels. The number of cabinets follows the game illustration.

- [Deng Deng Hi-Fi workshop and rig photo](https://urgentpedagogies.iaspis.se/a-public-design-broadcast/)
- [Roots Invasion and Deng Deng sound system session](https://www.hausmania.org/nyheter/223595)
- [Rockers Ark rig photo and listing](https://www.soundsystem.world/soundsystems/rockers-ark-soundsystem/)
- [Lighthouse rig photo and listing](https://www.soundsystem.world/soundsystems/lighthouse-sound-system/)
