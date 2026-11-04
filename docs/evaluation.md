# Evaluation

Each AI driver and the hand-written driver race for 120 seconds on every track. `17.33s × 6` means 6 laps with a best of 17.33s; time spent touching the barrier is listed when there was any. Generated with `node tools/evaluate.mjs <brain file>`.

"Beats the baseline" below means: with no driver aids, the AI completed at least as many laps as the hand-written driver and set a faster best lap.

## Summary across the four runs that trained properly (seeds 1 to 4)

| Unseen track | Seed 1 | Seed 2 | Seed 3 | Seed 4 | Beats baseline |
| --- | --- | --- | --- | --- | --- |
| mirrored | ✓ 18.48s × 6 | ✗ 19.15s × 5, 13.1s on barrier | ✓ 18.38s × 6 | ✓ 18.52s × 6 | 3/4 |
| kidney | ✓ 11.57s × 10 | ✗ 11.97s × 9 | ✓ 11.47s × 10 | ✗ 13.08s × 9 | 2/4 |
| kidney, reversed | ✓ 11.32s × 10 | ✓ 11.18s × 10 | ✓ 11.07s × 10 | ✓ 11.32s × 10 | 4/4 |
| technical | ✗ 13.65s × 4 | ✗ 19.65s × 6, 15.4s on barrier | ✗ no lap (0s on barrier) | ✗ no lap (11s on barrier) | 0/4 |
| technical, reversed | ✗ 13.62s × 1 | ✗ 23.60s × 4, 45.1s on barrier | ✗ 13.60s × 1, 0.0s on barrier | ✗ 17.92s × 3, 8.9s on barrier | 0/4 |

Totals: 9/12 on the three unseen tracks with corners like the training circuit (mirrored, kidney both ways), 0/8 on the technical track (both ways), 9/20 overall.

## Seed 1

| Track | Hand-written (ABS + TC on) | Hand-written (no aids) | AI (no aids) | AI (ABS + TC on) |
| --- | --- | --- | --- | --- |
| main (trained on) | 18.97s × 6 | 19.30s × 6 | 18.10s × 6 | 18.07s × 6 |
| main, reversed (trained on) | 18.82s × 6 | 19.00s × 6 | 18.03s × 6 | 18.02s × 6 |
| mirrored (never seen) | 18.82s × 6 | 19.00s × 6 | 18.48s × 6 | 18.42s × 6 |
| kidney (never seen) | 11.68s × 10 | 11.93s × 9 | 11.57s × 10 | 11.53s × 10 |
| kidney, reversed (never seen) | 11.67s × 10 | 11.72s × 10 | 11.32s × 10 | 11.30s × 10 |
| technical (never seen) | 15.97s × 7 | 17.33s × 6, 0.1s on barrier | 13.65s × 4 | 14.38s × 1 |
| technical, reversed (never seen) | 15.70s × 7 | 16.28s × 7 | 13.62s × 1 | 13.95s × 1 |

## Seed 2

| Track | Hand-written (ABS + TC on) | Hand-written (no aids) | AI (no aids) | AI (ABS + TC on) |
| --- | --- | --- | --- | --- |
| main (trained on) | 18.97s × 6 | 19.30s × 6 | 18.22s × 6 | 18.18s × 6 |
| main, reversed (trained on) | 18.82s × 6 | 19.00s × 6 | 18.30s × 6 | 18.23s × 6 |
| mirrored (never seen) | 18.82s × 6 | 19.00s × 6 | 19.15s × 5, 13.1s on barrier | 18.27s × 6 |
| kidney (never seen) | 11.68s × 10 | 11.93s × 9 | 11.97s × 9 | 11.98s × 9 |
| kidney, reversed (never seen) | 11.67s × 10 | 11.72s × 10 | 11.18s × 10 | 11.15s × 10 |
| technical (never seen) | 15.97s × 7 | 17.33s × 6, 0.1s on barrier | 19.65s × 6, 15.4s on barrier | no lap (3s on barrier) |
| technical, reversed (never seen) | 15.70s × 7 | 16.28s × 7 | 23.60s × 4, 45.1s on barrier | 13.80s × 7 |

## Seed 3 (the shipped pro driver)

| Track | Hand-written (ABS + TC on) | Hand-written (no aids) | AI (no aids) | AI (ABS + TC on) |
| --- | --- | --- | --- | --- |
| main (trained on) | 18.97s × 6 | 19.30s × 6 | 18.10s × 6 | 18.00s × 6 |
| main, reversed (trained on) | 18.82s × 6 | 19.00s × 6 | 18.18s × 6 | 18.17s × 6 |
| mirrored (never seen) | 18.82s × 6 | 19.00s × 6 | 18.38s × 6 | 18.50s × 6 |
| kidney (never seen) | 11.68s × 10 | 11.93s × 9 | 11.47s × 10 | 11.48s × 10 |
| kidney, reversed (never seen) | 11.67s × 10 | 11.72s × 10 | 11.07s × 10 | 11.07s × 10 |
| technical (never seen) | 15.97s × 7 | 17.33s × 6, 0.1s on barrier | no lap (0s on barrier) | 22.72s × 1 |
| technical, reversed (never seen) | 15.70s × 7 | 16.28s × 7 | 13.60s × 1, 0.0s on barrier | 13.67s × 1 |

## Seed 4

| Track | Hand-written (ABS + TC on) | Hand-written (no aids) | AI (no aids) | AI (ABS + TC on) |
| --- | --- | --- | --- | --- |
| main (trained on) | 18.97s × 6 | 19.30s × 6 | 18.45s × 6 | 18.38s × 6 |
| main, reversed (trained on) | 18.82s × 6 | 19.00s × 6 | 18.38s × 6 | 18.33s × 6 |
| mirrored (never seen) | 18.82s × 6 | 19.00s × 6 | 18.52s × 6 | 18.55s × 6 |
| kidney (never seen) | 11.68s × 10 | 11.93s × 9 | 13.08s × 9 | 12.08s × 9 |
| kidney, reversed (never seen) | 11.67s × 10 | 11.72s × 10 | 11.32s × 10 | 11.32s × 10 |
| technical (never seen) | 15.97s × 7 | 17.33s × 6, 0.1s on barrier | no lap (11s on barrier) | 18.93s × 6, 20.8s on barrier |
| technical, reversed (never seen) | 15.70s × 7 | 16.28s × 7 | 17.92s × 3, 8.9s on barrier | 14.50s × 8 |

# Trained on varied circuits

Four runs trained with `node tools/train.mjs 120 <file> <seed> varied` (main, chevrons and switchback circuits, both ways round). None of these is shipped.

## Varied seed 1

| Track | Hand-written (ABS + TC on) | Hand-written (no aids) | AI (no aids) | AI (ABS + TC on) |
| --- | --- | --- | --- | --- |
| main (trained on) | 18.97s × 6 | 19.30s × 6 | 18.57s × 6 | 18.60s × 6 |
| main, reversed (trained on) | 18.82s × 6 | 19.00s × 6 | 18.67s × 6 | 18.68s × 6 |
| mirrored (never seen) | 18.82s × 6 | 19.00s × 6 | 18.32s × 6 | 18.30s × 6 |
| kidney (never seen) | 11.68s × 10 | 11.93s × 9 | 11.95s × 9 | 11.95s × 9 |
| kidney, reversed (never seen) | 11.67s × 10 | 11.72s × 10 | 11.73s × 10 | 11.73s × 10 |
| technical (never seen) | 15.97s × 7 | 17.33s × 6, 0.1s on barrier | no lap (5s on barrier) | no lap (11s on barrier) |
| technical, reversed (never seen) | 15.70s × 7 | 16.28s × 7 | 13.88s × 1, 5.9s on barrier | 13.93s × 1, 30.5s on barrier |

## Varied seed 2

| Track | Hand-written (ABS + TC on) | Hand-written (no aids) | AI (no aids) | AI (ABS + TC on) |
| --- | --- | --- | --- | --- |
| main (trained on) | 18.97s × 6 | 19.30s × 6 | 18.77s × 6 | 18.75s × 6 |
| main, reversed (trained on) | 18.82s × 6 | 19.00s × 6 | 19.42s × 6 | 19.25s × 6 |
| mirrored (never seen) | 18.82s × 6 | 19.00s × 6 | 18.87s × 6 | 18.87s × 6 |
| kidney (never seen) | 11.68s × 10 | 11.93s × 9 | 12.32s × 9 | 12.32s × 9 |
| kidney, reversed (never seen) | 11.67s × 10 | 11.72s × 10 | 11.90s × 9 | 11.87s × 10 |
| technical (never seen) | 15.97s × 7 | 17.33s × 6, 0.1s on barrier | 13.57s × 8 | 13.52s × 8 |
| technical, reversed (never seen) | 15.70s × 7 | 16.28s × 7 | 13.72s × 8 | 13.75s × 8 |

## Varied seed 3

| Track | Hand-written (ABS + TC on) | Hand-written (no aids) | AI (no aids) | AI (ABS + TC on) |
| --- | --- | --- | --- | --- |
| main (trained on) | 18.97s × 6 | 19.30s × 6 | 18.57s × 6 | 18.55s × 6 |
| main, reversed (trained on) | 18.82s × 6 | 19.00s × 6 | 18.65s × 6 | 18.63s × 6 |
| mirrored (never seen) | 18.82s × 6 | 19.00s × 6 | 18.65s × 6 | 18.65s × 6 |
| kidney (never seen) | 11.68s × 10 | 11.93s × 9 | 12.05s × 9 | 12.08s × 9 |
| kidney, reversed (never seen) | 11.67s × 10 | 11.72s × 10 | 11.75s × 10 | 11.75s × 10 |
| technical (never seen) | 15.97s × 7 | 17.33s × 6, 0.1s on barrier | 13.28s × 8 | 13.22s × 8 |
| technical, reversed (never seen) | 15.70s × 7 | 16.28s × 7 | 14.20s × 7 | 14.28s × 7 |

## Varied seed 4

| Track | Hand-written (ABS + TC on) | Hand-written (no aids) | AI (no aids) | AI (ABS + TC on) |
| --- | --- | --- | --- | --- |
| main (trained on) | 18.97s × 6 | 19.30s × 6 | 19.50s × 6 | 19.35s × 6 |
| main, reversed (trained on) | 18.82s × 6 | 19.00s × 6 | 18.48s × 6 | 18.40s × 6 |
| mirrored (never seen) | 18.82s × 6 | 19.00s × 6 | 19.07s × 6 | 19.15s × 6 |
| kidney (never seen) | 11.68s × 10 | 11.93s × 9 | 12.67s × 9 | 12.72s × 9 |
| kidney, reversed (never seen) | 11.67s × 10 | 11.72s × 10 | 11.53s × 10 | 11.55s × 10 |
| technical (never seen) | 15.97s × 7 | 17.33s × 6, 0.1s on barrier | 13.77s × 8 | 13.83s × 8 |
| technical, reversed (never seen) | 15.70s × 7 | 16.28s × 7 | 14.32s × 8 | 14.07s × 8 |

