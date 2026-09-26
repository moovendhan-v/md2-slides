# Product video

The md2slides demo video is generated from code, so it can be re-rendered whenever the product changes. It covers:

- Real app footage.
- Motion graphics.
- A neural voiceover with burned-in captions.
- An original music bed and UI sound effects.

```bash
npm run build && npm run start -- -p 3100   # the app, in another terminal
npm run video                                # capture + render 16:9 and the vertical cut
```

Output goes to `video/out/`:

| File | What |
|---|---|
| `md2slides-demo-1080p.mp4` | 1920×1080, 30 fps, H.264 + AAC, about 90 s |
| `md2slides-demo-vertical.mp4` | 1080×1920 cut (hook, live preview, MCP, CTA), about 30 s |
| `*.srt` | Captions, if you'd rather upload them as a separate track |

## Pipeline

| Step | File | Notes |
|---|---|---|
| Storyboard | `storyboard.mjs` | The scenes, narration lines and chapter names. Edit the words here. |
| Capture | `capture.mjs` | Playwright drives the running app against a mocked GitHub repo (`lib/mock.mjs`, so no sign-in is needed). A scripted cursor moves through each scene. Frames come from the DevTools screencast at 1.5× DPR, with camera cues (`rec.focus`) and click/key cues (`lib/recorder.mjs`). It also renders slide stills for the motion scenes. |
| Voice | `voice.mjs` | [Piper](https://github.com/rhasspy/piper) neural TTS, offline, `pip install piper-tts`. The voice model is downloaded once from Hugging Face. Scene lengths follow the narration. |
| Music & SFX | `music.py` | An original track synthesized with numpy/scipy (lo-fi, 100 BPM), with a riser into the call to action and an ending chord, plus whoosh, click, key and pop effects. It is royalty-free because it's generated. |
| Compositing | `stage/` | An HTML stage where every frame is a pure function of time: app window, eased camera zooms, captions timed word by word to the voice, chapter labels, scene transitions, and motion-graphics scenes (`stage/scenes.js`). |
| Render | `render.mjs` | Screenshots each frame and pipes it to ffmpeg (the `imageio-ffmpeg` binary, or `FFMPEG=`). It builds the voice and SFX tracks (`mix.py`), ducks the music under the voice with a sidechain compressor, and normalises to -14 LUFS. |

Useful flags:

```bash
node video/capture.mjs live share         # re-shoot some clips
node video/render.mjs --at 4.5,20,60      # preview frames as PNGs in video/out/
node video/render.mjs --only live,share   # render part of the video
node video/render.mjs --draft             # 15 fps, fast encode
node video/render.mjs --vertical          # 9:16 cut
```

Requirements:
- Node 20+ and Python 3 with `numpy scipy piper-tts imageio-ffmpeg`.
- Chromium for Playwright.
- The app running at `APP_URL` (default `http://localhost:3100`).
