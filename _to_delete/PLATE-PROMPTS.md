# Nature Care — Photoreal Plate Prompts

Generate these 5 images and attach them in the chat (or drop them into `Naturecare\image\plates\`).
Best tool: **Google Gemini (Nano Banana / "Create image")** — it can keep the same scene when you
attach the base image and ask for a relight. ChatGPT or Midjourney (`--cref` / vary) also work.

**Settings for every image:** landscape **16:9**, the largest resolution offered (2K if possible),
**no text / no watermark**. Save as JPG.

---

## 1 — BASE PLATE (generate this FIRST, from text only)  → save as `day.jpg`

```
Ultra-realistic landscape photograph, full-frame camera, 35mm lens, wide establishing shot, eye level.
A solar-powered electric security fence runs across the lower third of the frame: galvanized steel
posts about 1.8 m tall, evenly spaced, each carrying SEVEN taut horizontal high-tensile steel wires on
small white insulators. The fence line starts in the left foreground and recedes gently toward the
right mid-ground, following a red-earth boundary path along the edge of a lush coffee plantation in
the Western Ghats, Karnataka, India. Near side of the fence: neat rows of dark-green coffee shrubs.
Beyond the fence: dense tropical forest treeline and layered misty blue-green hills. In the mid-ground
right, one fence post carries a small solar panel on a bracket with a compact energizer box below it.
Big open sky filling the top 55% of the frame — late morning, clear blue with a few thin high clouds,
sun high and to the right, crisp natural light, deep natural shadows, rich but true-to-life colours.
No people, no animals, no text, no logos, no watermark. Photojournalistic realism, tack-sharp detail.
```

## 2 — DAWN  (attach `day.jpg` as the reference image, then paste)  → save as `dawn.jpg`

```
Using the attached photo, keep the EXACT same scene, camera position, framing, fence, posts, wires,
path, coffee rows, forest and hills. Change ONLY the time of day to sunrise: the sun is just rising
above the hills on the far LEFT, low warm golden light raking across the scene, long soft shadows,
thin mist lying in the valley and between the coffee rows, sky graded from deep indigo at the top to
peach-orange at the horizon. Photorealistic, natural, no text, no watermark.
```

## 3 — DUSK  (attach `day.jpg`)  → save as `dusk.jpg`

```
Using the attached photo, keep the EXACT same scene, camera position, framing, fence, posts, wires,
path, coffee rows, forest and hills. Change ONLY the time of day to golden-hour sunset: the sun is
low on the far RIGHT just above the hills, warm orange and magenta sky with a few lit clouds, the
forest and hills darker and silhouetted, long shadows, warm rim light on the fence wires and posts.
Photorealistic, natural, no text, no watermark.
```

## 4 — TWILIGHT  (attach `day.jpg`)  → save as `twilight.jpg`

```
Using the attached photo, keep the EXACT same scene, camera position, framing, fence, posts, wires,
path, coffee rows, forest and hills. Change ONLY the time of day to blue hour, twenty minutes after
sunset: no sun visible, deep blue sky fading to a faint amber band on the horizon at the right, the
first few stars appearing high in the sky, forest and hills as dark silhouettes, the scene dim but
still readable, cool blue tones. Photorealistic long-exposure look, no text, no watermark.
```

## 5 — NIGHT  (attach `day.jpg`)  → save as `night.jpg`

```
Using the attached photo, keep the EXACT same scene, camera position, framing, fence, posts, wires,
path, coffee rows, forest and hills. Change ONLY the time of day to deep night: no sun, a clear dark
sky full of real stars with the Milky Way arching across the top, faint moonlight from the upper
left softly outlining the fence posts and wires, forest and hills as near-black silhouettes, the
foreground very dark but the fence still faintly visible. Realistic long-exposure night photograph,
natural, no text, no watermark.
```

---

Tips: if a relight drifts (moves the fence, adds things), regenerate it — consistency matters more
than beauty. If Gemini refuses the "attach photo" step, use "Edit" on the base image instead of a new
chat. Send whatever you get — I'll fix small mismatches in the compositing.
