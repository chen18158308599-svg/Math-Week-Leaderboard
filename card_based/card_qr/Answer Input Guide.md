# Card QR Codes and Answer Input Guide (Committee Edition)

**Contains answers. Do not display publicly or distribute to players.**

## General answer rules

Players scan the QR on a card at the library. If signed out, they sign in with their school account and return to that card. Correct answers award points automatically, once per activity.

Equivalent fractions, decimals, mathematical expressions, full-width digits, thousands separators, case differences and spacing variations are accepted where supported. Units appear beside the input fields. Answers may omit the unit or include the listed unit; the system does not convert between different units.

Players have three incorrect attempts per answer activity. Blank answers, missing sub-answers and unparseable input do not use an attempt. A mathematically incorrect answer or incorrect selection does. All parts must be correct to earn the activity points.

No. 07 uses multiple selection. No. 06, 08 and 13 use separate fields. No. 18 uses a restricted arithmetic parser; submitted program code is never executed.

Integer answers must match exactly, allowing forms such as 48.0. Fractional probabilities allow an absolute error of 0.005. The first two parts of No. 06 also allow 0.005. No. 05 is checked to one decimal place; No. 12 and 14 to the nearest whole percentage; No. 21 to the nearest whole centimetre.

## Committee activity claims

COM 01-05 each have two QR codes: **completed = 10 points; completed with explanation = 20 points total**. A player who has already claimed 10 receives only 10 more from the explanation code. Claiming the completion code after receiving 20 adds nothing. Repeated scans do not add points. Each activity has a maximum of 20 points per player.

These codes replace the old COM information-page codes. Use `Card_QR_Print_A4_v2.pdf`; the old PDF is obsolete. Keep committee codes private. Show the appropriate code only after verifying completion or explanation in person.

Keep a private backup of `committee_codes.private.json` and this QR batch. Reuse the same codes when regenerating files.

## Prompts, points and accepted answers

### No. 01 - Age Difference Puzzle

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_01.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/age-difference
- Player prompt: **His brother will be ____ years old.**
- Accepted answers: 48, 48.0, 48 years, forty-eight. The unit may be omitted.

### No. 02 - Two-Child Probability Puzzle

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_02.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/two-child-probability
- Player prompt: **The probability is ____ (fraction).**
- Accepted answers: 1/3, 2/6, 0.333, 0.33, 33.3%, one third. Absolute probability error up to 0.005 from 1/3 is accepted.

### No. 03 - Six-Matchstick Triangle Challenge

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_03.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/six-matchsticks
- Player prompt: **The maximum is ____ triangles.**
- Accepted answers: 4, 4.0, four, 4 triangles.

### No. 04 - Pick's Theorem Area Challenge

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_04.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/lattice-areas
- Player prompt: **The total area is ____ square units.**
- Accepted answers: 20, 20.0, 4+3+6+7, 20 square units. Submit the total area only.

### No. 05 - Will the Boy Be Safe?

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_05.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/falling-tree
- Player prompt: **The treetop reaches ____ ft (1 decimal place).**
- Accepted answers: 6.9, 6.90, 6.93 ft, 4*sqrt(3), sqrt(48) feet. The value must round to 6.9 to one decimal place. The boy is 6 ft away; 6 is not the requested distance.

### No. 06 - Infinite Radical Challenge

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_06.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/nested-radicals
- Player prompt: **(a) = ____ (fraction).** / **(b) = ____ (3 decimal places).** / **(c) = ____ (whole number).**
- Accepted answers: Three fields: (a) 4/3, 8/6, 1.333, 1.33; (b) 1.618, 1.62, (1+sqrt(5))/2; (c) 4, 4.0, 2^2. Absolute error up to 0.005 is accepted for (a) and (b); (c) must equal 4 exactly.

### No. 07 - Mirror Symmetry Challenge

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_07.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/reversed-terms
- Player prompt: **Select all words that stay the same in the mirror.**
- Accepted answers: Select WOW, TOOT, AHA and MUM, with no other options selected. Order does not matter.

### No. 08 - Patterned Sum Challenge

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_08.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/sin-squared-sums
- Player prompt: **The first sum is ____ .** / **The second sum is ____ .**
- Accepted answers: First field: 45.5 or 91/2. Second field: 50 or 100/2. Follow the order on the card.

### No. 09 - Find the Fallacy

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_09.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/find-the-fallacy
- Player prompt: **The line numbers are ____ (A, B, C; 3 digits).**
- Accepted answers: 762, 7 6 2, 7,6,2, 7-6-2. The order must be A, B, C.

### No. 10 - The Fake Coin

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_10.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/fake-coin
- Player prompt: **At least ____ weighings are needed.**
- Accepted answers: 3, 3.0, three, 3 weighings.

### No. 11 - Palindrome Pattern

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_11.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/palindrome-combinations
- Player prompt: **There are ____ combinations.**
- Accepted answers: 456976, 456,976, 26^4.

### No. 12 - Passcode Collision

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_12.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/passcode-birthday
- Player prompt: **The probability is ____ % (nearest whole number).**
- Accepted answers: 99, 99%, 98.92%, 98.9, 0.9892, 0.99. The percentage must round to 99 as a whole number. Values between 0 and 1 are interpreted as probabilities; 0.99% is not 99%.

### No. 13 - Mean vs. Median

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_13.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/mean-vs-median
- Player prompt: **The mean is RM ____ .** / **The median is RM ____ .**
- Accepted answers: Two fields: mean 1254000 (also 1,254,000, RM1,254,000, MYR 1254000); median 60000 (also 60,000, RM 60,000). Both must be correct.

### No. 14 - Rare Disease and False Positives

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_14.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/false-positive
- Player prompt: **The probability is ____ % (nearest whole number).**
- Accepted answers: 9, 9%, 9.09%, 0.09, 1/11. The percentage must round to 9 as a whole number. 91% answers a different question and is rejected.

### No. 15 - Shortest Path for a Delivery Robot

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_15.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/shortest-path
- Player prompt: **The shortest time is ____ minutes.**
- Accepted answers: 3, 3.0, 3 min, 3 mins, 3 minutes, three.

### No. 16 - Mondrian Art Problem

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_16.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/mondrian-art
- Player prompt: **The lowest score is ____ .**
- Accepted answers: 5, 5.0, five.

### No. 17 - Equation to 45

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_17.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/equation-to-45
- Player prompt: **There are ____ equations.**
- Accepted answers: 24, 24.0, twenty-four. Submit the number of equations, not an individual equation equal to 45.

### No. 18 - Target 24

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_18.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/target-24
- Player prompt: **My expression is ____ (use 1, 10, 12, 6 once; +, −, ×, ÷ and brackets).**
- Accepted answers: Any expression equal to 24 using 1, 10, 12 and 6 exactly once each, with the four arithmetic operations and brackets. Examples: 10*12/(6-1), 12*10/(6-1)=24, 10/((6-1)/12). Reject 24 alone, 12+12, or expressions using an extra 0.

### No. 19 - Cryptogram Puzzle

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_19.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/cryptogram
- Player prompt: **The message is ____ .**
- Accepted answers: MATHEMATICS IS THE QUEEN OF THE SCIENCES. Case, spaces and punctuation are ignored.

### No. 20 - The Monty Hall Problem

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_20.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/monty-hall
- Player prompt: **The probability after switching is ____ (fraction).**
- Accepted answers: 2/3, 4/6, 0.6667, 0.67, 66.67%, 67%, two thirds. Absolute probability error up to 0.005 from 2/3 is accepted. The words switch or yes alone are not a probability answer.

### No. 21 - Kissing Circles

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_21.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/kissing-circles
- Player prompt: **The radius is ____ cm (nearest whole number).**
- Accepted answers: 22, 22 cm, 22.01 centimetres. The value must round to 22 to the nearest whole centimetre. Use cm; metres and feet are not converted.

### No. 22 - The Josephus Problem

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/No_22.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/josephus
- Player prompt: **The surviving seat is number ____ .**
- Accepted answers: 3, 3.0, three, or 3 followed by the Chinese seat-number suffix (U+53F7).

### FINAL - Mystery Chest Decode Card

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/FINAL.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/mystery-chest
- Player prompt: **The password is ____ (4 digits).**
- Accepted answers: 4693, 4 6 9 3, 4-6-9-3. Digit order is fixed. Completing the source puzzles first is not currently required.

### INT 01 - Kanoodle, Floor Edition

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/INT_01.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/kanoodle
- Player prompt: **The passcode is ____ (5 letters, in reading order).**
- Accepted answers: CLBHG, clbhg, C L B H G, C,L,B,H,G. Letter order is fixed.

### INT 02 - Tower of Hanoi

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/INT_02.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/tower-of-hanoi
- Player prompt: **The move is ____ (disk number + peg letter, e.g. 4B).**
- Accepted answers: 1A, 1a, 1 A, 1-A. The disk number comes before the peg letter.

### INT 03 - Bagua: The Round Table of Eight

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/INT_03.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/bagua
- Player prompt: **The passcode is ____ (3 digits, clockwise).**
- Accepted answers: 813, 8 1 3, 8-1-3. Digit order is fixed.

### INT 04 - Liar Dialogue

- Points: 20 by default; existing Admin settings are preserved.
- QR: `png/INT_04.png`
- URL: https://math-week-leaderboard.vercel.app/puzzle/liar-dialogue
- Player prompt: **The hidden number is ____ (2 digits).**
- Accepted answers: 91, 91.0, ninety-one.

### COM 01 - Conway's Soldiers

- Points: 10 for completion; 20 total for completion with explanation. A later explanation claim adds the remaining 10. Maximum: 20 per activity.
- Player prompt: **Complete the challenge: 10 points. Explain your solution: 20 points total.**
- Verification: The reference answer is 20. Staff must also verify that the player actually reaches the fourth row. Entering 20 alone cannot claim points.
- Completion QR (10 points): `png/COM_01_completed.png`
- Explanation QR (20 total): `png/COM_01_explained.png`
- Staff verify the result and show the appropriate QR. The player scans, signs in and confirms the claim. No typed answer is required.

### COM 02 - The Knight's Tour

- Points: 10 for completion; 20 total for completion with explanation. A later explanation claim adds the remaining 10. Maximum: 20 per activity.
- Player prompt: **Complete the challenge: 10 points. Explain your solution: 20 points total.**
- Verification: A full 8-by-8 tour takes 63 moves. Staff verify the chosen board and the actual completion.
- Completion QR (10 points): `png/COM_02_completed.png`
- Explanation QR (20 total): `png/COM_02_explained.png`
- Staff verify the result and show the appropriate QR. The player scans, signs in and confirms the claim. No typed answer is required.

### COM 03 - A Blind, A Deaf, A Mute

- Points: 10 for completion; 20 total for completion with explanation. A later explanation claim adds the remaining 10. Maximum: 20 per activity.
- Player prompt: **Complete the challenge: 10 points. Explain your solution: 20 points total.**
- Verification: 532 is only an example in the answer sheet. The correct answer depends on the clue card used by staff for that attempt.
- Completion QR (10 points): `png/COM_03_completed.png`
- Explanation QR (20 total): `png/COM_03_explained.png`
- Staff verify the result and show the appropriate QR. The player scans, signs in and confirms the claim. No typed answer is required.

### COM 04 - Rubik Mini Booth

- Points: 10 for completion; 20 total for completion with explanation. A later explanation claim adds the remaining 10. Maximum: 20 per activity.
- Player prompt: **Complete the challenge: 10 points. Explain your solution: 20 points total.**
- Verification: There is no fixed typed answer. Rubik Society staff verify completion of the assigned challenge. Do not use 20 as this card's answer.
- Completion QR (10 points): `png/COM_04_completed.png`
- Explanation QR (20 total): `png/COM_04_explained.png`
- Staff verify the result and show the appropriate QR. The player scans, signs in and confirms the claim. No typed answer is required.

### COM 05 - Luban Lock & Rope Puzzle Challenge

- Points: 10 for completion; 20 total for completion with explanation. A later explanation claim adds the remaining 10. Maximum: 20 per activity.
- Player prompt: **Complete the challenge: 10 points. Explain your solution: 20 points total.**
- Verification: Reference answers: Lock = 6; Rope = No. Staff must verify the assembly or rope-loop actions. Handle difficulty levels and rewards according to the activity rules.
- Completion QR (10 points): `png/COM_05_completed.png`
- Explanation QR (20 total): `png/COM_05_explained.png`
- Staff verify the result and show the appropriate QR. The player scans, signs in and confirms the claim. No typed answer is required.

## Sources

`card_based/MathWeek_Card_Solutions.xlsx`, Answer Key rows 5-36, and `card_based/MathWeek_Code_Card_Based.pdf` (32 pages). Outdated Open Items notes, including the earlier 33-page count and old Rubik answer, are not used for current grading.

Committee activities require in-person verification before the appropriate code is shown. A code can serve multiple verified players; each player can earn at most 20 points per activity.
