#!/usr/bin/env python3
"""
Builds the voice and sound-effect tracks for the video from a JSON plan:
  { "duration": s, "voice": [{"file", "t"}], "sfx": [{"t", "kind", "gain"}], "sfxDir", "out" }
Writes <out>/voice.wav and <out>/sfx.wav (44.1 kHz stereo).
"""
import json
import sys
import wave

import numpy as np
from scipy.signal import resample_poly

SR = 44100


def read(path):
    with wave.open(path, "rb") as w:
        sr, ch, n = w.getframerate(), w.getnchannels(), w.getnframes()
        x = np.frombuffer(w.readframes(n), dtype="<i2").astype(np.float32) / 32768
    x = x.reshape(-1, ch).T
    if sr != SR:
        x = np.stack([resample_poly(c, SR, sr) for c in x])
    if x.shape[0] == 1:
        x = np.vstack([x, x])
    return x


def write(path, x):
    pcm = (np.clip(x, -1, 1).T * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def place(buf, sig, t, gain):
    i = int(t * SR)
    if i < 0 or i >= buf.shape[1]:
        return
    j = min(buf.shape[1], i + sig.shape[1])
    buf[:, i:j] += sig[:, : j - i] * gain


plan = json.load(open(sys.argv[1]))
n = int((plan["duration"] + 1) * SR)
voice = np.zeros((2, n), np.float32)
for v in plan["voice"]:
    x = read(v["file"])
    x = x / (np.abs(x).max() + 1e-9) * 0.7
    # Gentle presence: slight high-shelf by mixing in the first difference.
    x = x + 0.18 * np.concatenate([np.zeros((2, 1)), np.diff(x, axis=1)], axis=1)
    place(voice, x, v["t"], 1.0)

sfx = np.zeros((2, n), np.float32)
cache = {}
last = {}
for e in plan["sfx"]:
    k = e["kind"]
    if k == "key" and e["t"] - last.get(k, -1) < 0.035:
        continue  # keep fast typing from turning into noise
    last[k] = e["t"]
    if k not in cache:
        cache[k] = read(f'{plan["sfxDir"]}/{k}.wav')
    place(sfx, cache[k], e["t"], e["gain"])

write(f'{plan["out"]}/voice.wav', voice)
write(f'{plan["out"]}/sfx.wav', sfx * 0.8)
print("mix: voice + sfx tracks written")
