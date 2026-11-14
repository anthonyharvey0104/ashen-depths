**Archived only — not used by the game.** Pending Anthony's final approval.

# Light the Torch

Upbeat start-screen song for *Ashen Depths*. **Draft — pending Anthony's approval. Do not add this to the game.**

## Stats

- **Key:** D major (two sharps), with brief mixolydian color (C natural) in the verse
- **Tempo:** 140 BPM, 4/4
- **Length:** 36 bars = **61.714 s** exactly (2,721,600 samples at 44.1 kHz)
- **Form:** Intro (4 bars) / Verse (8) / Chorus (8) / Tag (8) / Chorus (8)
- **Peak:** about −3 dBFS, no leading silence
- **Loop:** The second chorus ends on a dominant A chord with a drum fill that resolves into the intro's D-major hook, so the WAV can loop gaplessly. The MP3 is 44.1 kHz ~128 kbps; most MP3 encoders add a short delay (~25 ms), so use the WAV if you need a sample-accurate loop.

## Vocal or instrumental

**Instrumental.** This computer has FluidSynth, SoX, and FFmpeg, but no singing synthesizer (no Festival, eSpeak, Piper, or similar SVS). Pitched TTS would have sounded robotic, so a **trumpet lead** carries the vocal melody, doubled in the intro and choruses by synth brass, with French horn harmony. Lyric syllables are embedded in the MIDI. A melody-only MIDI (trumpet + soft piano harmony) is included if vocals are added later.

## Instruments (General MIDI, FluidR3_GM)

Trumpet lead, French horn, string ensemble pads, fingered bass, brass-section stabs, synth-brass doubles, choir aahs (choruses and the tag lift), harp sparkle, timpani, and a drum kit with tambourine in the choruses. Style is N64-era sequenced music: tight timing, bright heroic tone, no copyrighted samples or melodies.

## Files

| File | Purpose |
|------|---------|
| `light_the_torch.mp3` | 44.1 kHz, 128 kbps stereo listen/game candidate |
| `light_the_torch.wav` | 44.1 kHz 16-bit stereo master (seamless loop) |
| `light_the_torch.mid` | Full arrangement |
| `light_the_torch_melody.mid` | Melody-only (plus a quiet harmonic bed) |
| `_build/` | Composer source and render intermediates (not for the game) |
