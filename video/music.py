#!/usr/bin/env python3
"""
Original, royalty-free soundtrack for the product video, synthesized from
scratch (numpy + scipy): a warm lo-fi / electronic bed at 100 BPM with pads,
electric-piano chords, bass and soft drums, a riser into the call to action
and an ending chord. Also renders the UI sound effects (whoosh, click, key).

  python3 music.py --duration 88 --cta 80.5 --out .cache/audio
"""
import argparse
import os
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
BPM = 100
BEAT = 60 / BPM
BAR = BEAT * 4
RNG = np.random.default_rng(7)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def lp(x, hz, order=2):
    return sosfilt(butter(order, hz, "low", fs=SR, output="sos"), x)


def hp(x, hz, order=2):
    return sosfilt(butter(order, hz, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def env_adsr(n, a, d, s, r):
    """Attack/decay/sustain/release envelope (seconds) over n samples."""
    t = np.arange(n) / SR
    dur = n / SR
    e = np.where(t < a, t / max(a, 1e-4), 1.0)
    e = np.where((t >= a) & (t < a + d), 1 - (1 - s) * (t - a) / max(d, 1e-4), e)
    e = np.where(t >= a + d, s, e)
    rel = np.clip((dur - t) / max(r, 1e-4), 0, 1)
    return e * rel


def saw(freq, n, phase=0.0):
    t = np.arange(n) / SR
    return 2 * ((freq * t + phase) % 1.0) - 1


def place(buf, sig, start, gain=1.0):
    i = int(start * SR)
    if i >= buf.shape[-1] or i + sig.shape[-1] <= 0:
        return
    j = min(buf.shape[-1], i + sig.shape[-1])
    buf[..., i:j] += sig[..., : j - i] * gain


def reverb(x, seconds=2.2, mix=0.28):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = RNG.standard_normal((2, n)) * np.exp(-t * 6.9 / seconds)
    ir = lp(ir, 6000)
    ir[:, : int(0.012 * SR)] = 0  # pre-delay
    ir /= np.sqrt((ir**2).sum(axis=1, keepdims=True))
    wet = np.stack([fftconvolve(x[c], ir[c])[: x.shape[1]] for c in range(2)])
    return x * (1 - mix) + wet * mix


# Am7 - Fmaj7 - Cmaj7 - G6 (a classic, warm vi-IV-I-V loop)
CHORDS = [
    (45, [57, 60, 64, 67]),
    (41, [57, 60, 64, 65]),
    (48, [55, 59, 60, 64]),
    (43, [55, 59, 62, 64]),
]


def pad_voice(freq, n):
    out = np.zeros((2, n))
    for c, det in enumerate((-0.07, 0.07)):
        v = sum(saw(freq * 2 ** ((det + k * 0.03) / 12), n, RNG.random()) for k in (-1, 0, 1)) / 3
        out[c] = v
    return lp(out, 1400)


def epiano(freq, n, vel=1.0):
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * 2 * freq * t) * np.exp(-t * 5) + 0.12 * np.sin(2 * np.pi * 3.01 * freq * t) * np.exp(-t * 9)
    tone *= np.exp(-t * 2.4) * vel
    trem = 1 + 0.08 * np.sin(2 * np.pi * 4.5 * t)
    return np.stack([tone * trem, tone * (2 - trem)]) * 0.5


def bass(freq, n):
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * 2 * freq * t)
    s = np.tanh(1.6 * s) * env_adsr(n, 0.005, 0.2, 0.7, 0.08)
    return np.stack([s, s])


def kick(n=int(0.45 * SR)):
    t = np.arange(n) / SR
    f = 45 + 95 * np.exp(-t * 28)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    s += 0.25 * RNG.standard_normal(n) * np.exp(-t * 200)
    return np.stack([s, s])


def snare(n=int(0.3 * SR)):
    t = np.arange(n) / SR
    noise = bp(RNG.standard_normal(n), 900, 7000) * np.exp(-t * 16)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25) * 0.5
    s = noise + body
    return np.stack([s, s]) * 0.6


def hat(n=int(0.08 * SR), open_=False):
    if open_:
        n = int(0.28 * SR)
    t = np.arange(n) / SR
    s = hp(RNG.standard_normal(n), 7000) * np.exp(-t * (18 if open_ else 60))
    return np.stack([s * 0.9, s * 1.1]) * 0.35


def render_music(duration, cta):
    n = int((duration + 3) * SR)
    pads = np.zeros((2, n))
    keys = np.zeros((2, n))
    bas = np.zeros((2, n))
    drums = np.zeros((2, n))
    fx = np.zeros((2, n))

    intro = 2 * BAR  # pad only, then the groove comes in
    brk0, brk1 = cta - 2 * BAR, cta  # drums drop out, the riser builds
    bars = int(np.ceil(duration / BAR)) + 1
    for b in range(bars):
        t0 = b * BAR
        if t0 >= duration + 1:
            break
        root, notes = CHORDS[b % 4]
        final = t0 >= cta
        length = (BAR * 2.2 if final else BAR) + 0.6
        m = int(length * SR)
        chord = sum(pad_voice(midi(nt), m) for nt in notes) / len(notes)
        place(pads, chord * env_adsr(m, 0.6, 0.3, 0.85, 0.9 if not final else 2.5), t0, 0.5)
        if final:
            break
        # Electric piano: chord on 1, then syncopated stabs, arpeggio in the groove.
        if t0 >= intro:
            for k, (beat, vel) in enumerate([(0, 0.9), (1.5, 0.55), (2.5, 0.65), (3.5, 0.5)]):
                for nt in notes if k == 0 else notes[1:]:
                    place(keys, epiano(midi(nt + 12 * (k > 0)), int(1.8 * SR), vel), t0 + beat * BEAT, 0.16)
        else:
            for i, nt in enumerate(notes + notes[::-1]):
                place(keys, epiano(midi(nt + 12), int(1.2 * SR), 0.6), t0 + i * BEAT / 2, 0.14)
        # Bass on 1 and the "and" of 3.
        if t0 >= intro:
            place(bas, bass(midi(root), int(BEAT * 1.7 * SR)), t0, 0.42)
            place(bas, bass(midi(root + (7 if b % 2 else 12)), int(BEAT * 0.9 * SR)), t0 + 2.5 * BEAT, 0.34)
        # Drums (swung eighths), out during the intro and the break.
        if intro <= t0 < brk0:
            for beat in (0, 2.5):
                place(drums, kick(), t0 + beat * BEAT, 0.85)
            for beat in (1, 3):
                place(drums, snare(), t0 + beat * BEAT, 0.42)
            for e in range(8):
                swing = 0.06 * BEAT if e % 2 else 0
                place(drums, hat(open_=(e == 7)), t0 + e * BEAT / 2 + swing, 0.5 + 0.3 * RNG.random())

    # Riser into the CTA: filtered noise sweep + rising tone, then an impact.
    rn = int((brk1 - brk0) * SR)
    t = np.arange(rn) / SR
    k = t / t[-1]
    noise = RNG.standard_normal(rn)
    rise = np.zeros(rn)
    for i in range(0, rn, 2048):  # stepped band sweep 400 Hz -> 9 kHz
        seg = noise[i : i + 2048 + 512]
        c = 400 * (9000 / 400) ** (i / rn)
        f = bp(seg, c * 0.7, min(c * 1.4, 18000))[: min(2048, rn - i)]
        rise[i : i + len(f)] = f
    tone = np.sin(2 * np.pi * np.cumsum(220 + 660 * k**2) / SR) * 0.25
    r = (rise * 0.8 + tone) * k**2
    place(fx, np.stack([r, r]), brk0, 0.5)
    imp = kick(int(1.2 * SR)) * 1.1
    crash = hp(RNG.standard_normal(int(2.5 * SR)), 4000) * np.exp(-np.arange(int(2.5 * SR)) / SR * 2.2) * 0.35
    place(fx, imp, cta, 0.9)
    place(fx, np.stack([crash, crash * 0.9]), cta, 0.6)

    wet = reverb(pads * 1.0 + keys * 1.0, 2.6, 0.32)
    mix = wet + lp(bas, 900) + drums * 0.55 + reverb(fx, 1.6, 0.25)
    # Gentle master: fade in/out, soft clip, normalize.
    total = int((duration + 2.5) * SR)
    mix = mix[:, :total]
    fade_in = np.clip(np.arange(total) / (1.2 * SR), 0, 1)
    fade_out = np.clip((total - np.arange(total)) / (2.5 * SR), 0, 1)
    mix *= fade_in * fade_out
    mix = np.tanh(mix * 1.3)
    return mix / (np.abs(mix).max() + 1e-9) * 0.89


def whoosh(seconds=0.75):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    noise = RNG.standard_normal(n)
    out = np.zeros(n)
    for i in range(0, n, 1024):
        c = 300 * (6000 / 300) ** np.sin(np.pi * i / n / 1.0) ** 1
        seg = bp(noise[i : i + 1536], max(80, c * 0.6), min(c * 1.6, 18000))[: min(1024, n - i)]
        out[i : i + len(seg)] = seg
    e = np.sin(np.pi * t / seconds) ** 2
    pan = np.linspace(-0.6, 0.6, n)
    s = out * e
    return np.stack([s * (1 - pan) / 2, s * (1 + pan) / 2]) * 1.4


def click():
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 180) + hp(RNG.standard_normal(n), 3000) * np.exp(-t * 400) * 0.4
    return np.stack([s, s]) * 0.5


def key():
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    s = bp(RNG.standard_normal(n), 1500, 6000) * np.exp(-t * 260) + np.sin(2 * np.pi * 340 * t) * np.exp(-t * 300) * 0.4
    return np.stack([s, s]) * 0.35


def pop():
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    f = 500 + 900 * np.exp(-t * 30)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22)
    return np.stack([s, s]) * 0.45


def write(path, x):
    x = np.clip(x, -1, 1)
    pcm = (x.T * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--duration", type=float, required=True)
    ap.add_argument("--cta", type=float, required=True)
    ap.add_argument("--out", default=".cache/audio")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    write(os.path.join(a.out, "music.wav"), render_music(a.duration, a.cta))
    write(os.path.join(a.out, "whoosh.wav"), whoosh())
    write(os.path.join(a.out, "click.wav"), click())
    write(os.path.join(a.out, "key.wav"), key())
    write(os.path.join(a.out, "pop.wav"), pop())
    print("music:", a.out)
