-- REAL production content for the Code (Card) Based puzzle set — transcribed from
-- digital_base/Questions.pdf + Solutions.pdf (handed over by the organiser,
-- Sep 2026). Unlike supabase/seed.sql, this is NOT dev/test data — run it once
-- against the real project via the Supabase SQL editor, same as the numbered
-- migrations. Safe to re-run (every insert is `on conflict do nothing`).
--
-- One `games` row (type='card') per question — each is its own scorable unit, since
-- submissions are unique per (user, game). Question 19 (the cryptogram) is skipped
-- per the organiser: it links to an external puzzle generator with no fixed answer,
-- so it can't be auto-graded here.
--
-- A few questions needed a judgment call to fit the "short prompt + single typed
-- answer, 3 attempts" format — flagged inline with "NOTE:" so they're easy to find
-- and reconsider:
--   - Q5, Q13: the source has a secondary yes/no discussion question alongside the
--     numeric one; only the numeric part is auto-graded here, the discussion stays
--     printed on the card for staff/students to talk through.
--   - Q7: only the 9 reversed-word list is graded, not the missing-shapes drawing
--     half (no way to grade a drawn answer through a text field).
--   - Q9: the source asks to find the fallacy in *three* separate "proofs"; only the
--     classic division-by-zero one is graded here (the most self-contained to phrase
--     as a short exact-ish answer). The other two stay as talking points on the card.
--   - Q17, Q18: genuinely open-ended ("any valid equation that equals 45/24") — true
--     auto-grading would need an expression evaluator, which this system doesn't
--     have. Only the example answers from the solutions are accepted; a
--     mathematically correct but different equation will be marked wrong. Worth
--     having staff spot-check these two booths rather than trusting it's fully
--     self-serve.
--
-- points_value defaults to 20 for all of them — adjust per-puzzle in /admin/games
-- if some should be worth more/less.

insert into games (id, name, type, points_value, is_active) values
  ('00000000-0000-0000-0000-000000000301', 'Age Difference Puzzle', 'card', 20, true),
  ('00000000-0000-0000-0000-000000000302', 'Two-Child Probability Puzzle', 'card', 20, true),
  ('00000000-0000-0000-0000-000000000303', 'Six-Matchstick Triangle Challenge', 'card', 20, true),
  ('00000000-0000-0000-0000-000000000304', 'Lattice Polygon Area Puzzle', 'card', 20, true),
  ('00000000-0000-0000-0000-000000000305', 'Falling Tree Geometry Problem', 'card', 20, true),
  ('00000000-0000-0000-0000-000000000306', 'Nested Radical Challenge', 'card', 20, true),
  ('00000000-0000-0000-0000-000000000307', 'Reversed Math Terms Puzzle', 'card', 20, true),
  ('00000000-0000-0000-0000-000000000308', 'Sum Identity Challenge', 'card', 20, true),
  ('00000000-0000-0000-0000-000000000309', 'Find the Fallacy', 'card', 20, true),
  ('00000000-0000-0000-0000-000000000310', 'Fake Coin Balance Puzzle', 'card', 20, true),
  ('00000000-0000-0000-0000-000000000311', 'Palindrome Pattern Problem', 'card', 20, true),
  ('00000000-0000-0000-0000-000000000312', 'Passcode Collision / Birthday Problem', 'card', 20, true),
  ('00000000-0000-0000-0000-000000000313', 'Mean vs Median Puzzle', 'card', 20, true),
  ('00000000-0000-0000-0000-000000000314', 'Medical Test / False Positive Probability', 'card', 20, true),
  ('00000000-0000-0000-0000-000000000315', 'Shortest Path / Dijkstra''s Algorithm', 'card', 20, true),
  ('00000000-0000-0000-0000-000000000316', 'Mondrian Art Problem', 'card', 20, true),
  ('00000000-0000-0000-0000-000000000317', 'Equation to 45 Challenge', 'card', 20, true),
  ('00000000-0000-0000-0000-000000000318', 'Target 24 Challenge', 'card', 20, true),
  ('00000000-0000-0000-0000-000000000320', 'Monty Hall Problem', 'card', 20, true)
on conflict (id) do nothing;

insert into card_puzzles (game_id, slug, prompt, correct_answer) values
  (
    '00000000-0000-0000-0000-000000000301',
    'age-difference',
    'How old will the younger brother be when Chunxiang is 50?',
    '48'
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    'two-child-probability',
    'What is the probability the other child is also a boy?',
    '1/3|0.33|0.333|33%|33.3%'
  ),
  (
    '00000000-0000-0000-0000-000000000303',
    'six-matchsticks',
    'Using exactly 6 matchsticks, what''s the max number of equilateral triangles?',
    '4'
  ),
  (
    '00000000-0000-0000-0000-000000000304',
    'lattice-areas',
    'Find Area1 + Area2 + Area3 + Area4.',
    '34.5|69/2'
  ),
  (
    -- NOTE: numeric part only — see file header.
    '00000000-0000-0000-0000-000000000305',
    'falling-tree',
    'How many feet must the boy move back to be safe? (Enter 0 if already safe.)',
    '0.93|0.93ft|0.9|0.92|0.928|4sqrt3-6|4√3-6'
  ),
  (
    '00000000-0000-0000-0000-000000000306',
    'nested-radicals',
    'Enter the three values in order, separated by commas.',
    '4/3,1.618,4|4/3,(1+√5)/2,4|1.33,1.618,4|4/3,1.62,4'
  ),
  (
    -- NOTE: reversed-words half only — see file header.
    '00000000-0000-0000-0000-000000000307',
    'reversed-terms',
    'Unscramble the 9 reversed math terms, in order, separated by commas.',
    'eigenspace,isomorphism,surjection,involution,manifold,idempotent,stochastic,homeomorphism,diffeomorphism|eigenspace;isomorphism;surjection;involution;manifold;idempotent;stochastic;homeomorphism;diffeomorphism'
  ),
  (
    '00000000-0000-0000-0000-000000000308',
    'sin-squared-sums',
    'Enter both sums in order, separated by a comma.',
    '91/2,50|45.5,50'
  ),
  (
    -- NOTE: division-by-zero argument only — see file header.
    '00000000-0000-0000-0000-000000000309',
    'find-the-fallacy',
    'In the "2 = 1" proof, what illegal operation is hidden in it?',
    'division by zero|divide by zero|dividing by zero|division by 0|divide by 0'
  ),
  (
    '00000000-0000-0000-0000-000000000310',
    'fake-coin',
    'Minimum number of weighings needed to guarantee finding the fake coin?',
    '3'
  ),
  (
    '00000000-0000-0000-0000-000000000311',
    'palindrome-combinations',
    'How many different 7-letter combinations are possible?',
    '456976|456,976'
  ),
  (
    '00000000-0000-0000-0000-000000000312',
    'passcode-birthday',
    'Probability at least two apartments share a passcode? (%, 2 dp)',
    '98.92%|98.92|0.9892|98.9%|99%'
  ),
  (
    -- NOTE: numeric part only — see file header.
    '00000000-0000-0000-0000-000000000313',
    'mean-vs-median',
    'Enter the new mean annual salary in RM (digits only, no commas needed).',
    '1254000|1,254,000|rm1254000|rm1,254,000'
  ),
  (
    '00000000-0000-0000-0000-000000000314',
    'false-positive',
    'What''s the simplest next step for the doctor to confirm the result?',
    'repeat the test|retest|repeat testing|independent retest|repeat the test independently|confirmatory test|run the test again|repeated independent test'
  ),
  (
    '00000000-0000-0000-0000-000000000315',
    'shortest-path',
    'Minimum total time (minutes) for the robot to reach Point B?',
    '3|3minutes|3mins|3min'
  ),
  (
    '00000000-0000-0000-0000-000000000316',
    'mondrian-art',
    'Minimum score (largest area − smallest area) for the example grid?',
    '5'
  ),
  (
    -- NOTE: open-ended puzzle, limited acceptance — see file header.
    '00000000-0000-0000-0000-000000000317',
    'equation-to-45',
    'Write one valid equation using the given numbers that equals 45.',
    '50-5=45|40+5=45|90/2=45|90÷2=45|15×3=45|15x3=45|54-9=45|36+9=45'
  ),
  (
    -- NOTE: open-ended puzzle, limited acceptance — see file header.
    '00000000-0000-0000-0000-000000000318',
    'target-24',
    'Write one valid expression using 1, 10, 12 and 6 that equals 24.',
    '12×10/(6-1)=24|12*10/(6-1)=24|(12×10)/(6-1)=24|(12*10)/(6-1)=24|12×10÷(6-1)=24|12*10÷(6-1)=24'
  ),
  (
    '00000000-0000-0000-0000-000000000320',
    'monty-hall',
    'Should you switch, and what''s your win probability if you do?',
    'switch,2/3|switch,0.67|switch,67%|yes,2/3|yes,0.67|yes,67%'
  )
on conflict (slug) do nothing;
