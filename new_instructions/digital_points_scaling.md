# Digital points scaling v1

Raw gameplay scores and existing formulas remain unchanged. Claim points are calculated in the server API, displayed separately, and recomputed inside the database claim transaction. Each award is an integer from 0 to 19, including digital legacy fixed-point claims (capped at 19). Physical/card awards are unchanged.

For a normal digital game:
- raw score 0 -> 0 points
- positive raw score -> max(1, floor(19 * min(raw score, target) / target))
- raw score at/above target -> 19 points

| Key | Target | Scoring review |
|---|---:|---|
| conway | 1210 | 10 per point, victory/opponent bonus, original hard cap 1210 |
| deal | 1640 | 600 for six pirates + up to 300 coins + 500 victory + 240 HP |
| knn | 5750 | Three rooms: 3*(500 key + 800 escape + 200 accuracy) + 1000 victory + 5*50 armor |
| sequence | 10000 | Calibration target for correct answers, first tries, encounters and 5000 victory bonus; not a claimed theoretical maximum |
| planarity | 1410 | 150 for three puzzles + 1000 victory + 200 HP + 60 shield |
| symmetry | 10000 | Calibration target for 6000 distance plus energy coins/questions; not a claimed theoretical maximum |
| average | n/a | The selected number is not an earned score; 0 pending final competition settlement |

Targets normalize different score scales; they do not imply equal difficulty or measured player-score distributions. Tune targets if actual playtest distributions justify it while retaining the 19-point cap.

Examples: Deal raw 215 -> 2 claim points; Symmetry raw 1394 -> 2; Conway raw 1210 -> 19; KNN raw 5750 or above -> 19.

Apply migration 0012 after 0010/0011 in Supabase SQL Editor. Old pending QR records are recomputed at claim time, ignoring their old high snapshots. Historical committed awards are not retroactively changed. Sixty-second expiry, single-use QR and one award per account/game remain in effect. Average settlement has no automated rule yet; any future settlement must also follow the under-20 policy.

Verification: test:digital-claims compares SQL and TypeScript results for all seven keys over zero, small, representative and extreme scores; checks monotonicity and cap, verifies a stale raw-score snapshot cannot bypass scaling, and preserves physical-game fixed points. Original game scoring tests remain in the game repository.
