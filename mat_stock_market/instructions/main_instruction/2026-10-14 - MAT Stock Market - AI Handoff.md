---
type: handoff
status: review-needed
project: MAT x Library Mathematics Week 2026
tags:
  - codex
  - project
  - draft
created: 2026-10-14
source: Current project discussion, supplied library datasets, generated PDF and spreadsheet deliverables
---

# MAT × Library Mathematics Week 2026 Stock Market Game — AI Handoff

## 1. Purpose of this handoff

You are taking over the design and implementation handoff for the Stock Market Game used in MAT × Library Mathematics Week 2026.

The current scope contains three fictional stocks based on real library data:

- `LIB` — Library Footfall Index
- `BOOK` — Library Resources Index
- `DONA` — Collection Growth Index

`SCM` is not included in the current completed dataset package. Do not add it unless the user asks again.

The game is not meant to reproduce a real financial market. Historical library observations are compressed into hourly game data to create an understandable and entertaining price path.

## 2. Decisions already made

### Game structure

- There are 8 game days.
- Each day has 24 hourly quotations, from `00:00` to `23:00`.
- Each stock therefore has exactly 192 quotation rows.
- All three stocks start at `M$100.00` on Day 1 at `00:00`.
- Each player starts with `M$5,000`.
- `00:00` is the opening quotation. The first price movement occurs at `01:00`.
- Day `n+1` at `00:00` inherits Day `n` at `23:00` closing price.
- Do not calculate a return between the final observation of one historical group and the first observation of the next group.
- Each calculated price is rounded to two decimal places before it becomes the next hour's opening price.

### Leaderboard

The leaderboard uses money only.

```text
Player total assets = cash + sum(share quantity × current stock price)
```

Rank players from highest to lowest final assets.

Do not add:

- knowledge points;
- market points;
- participation points;
- separate educational scores.

## 3. Data selection

### LIB

Source metric:

```text
LIB = Gate A + Gate B + Gate C + Gate D
```

Do not trust the source `Total` field because it contains missing or inconsistent values. Recalculate the total from the four gates.

Selected historical months:

1. March 2025
2. April 2025
3. May 2025
4. June 2025
5. July 2025
6. September 2025
7. October 2025
8. November 2025

For each month, use the first 24 valid, positive, non-duplicate dates with all four gate values available.

August 2025 was excluded because it only had 22 usable observations and contained a 13,133 anomaly.

### BOOK

Count daily transactions where:

```text
TransactionType = issue
```

Do not count `renew` as a borrowed book transaction.

If a date contains renew transactions but no issue transaction, keep `issue = 0` as a real observation. It is not missing data.

Selected historical months:

1. November 2025
2. December 2025
3. January 2026
4. March 2026
5. April 2026
6. May 2026
7. June 2026
8. July 2026

February and August 2026 were excluded because each provided only 23 active dates.

### DONA

Valid records require:

- `Status = OK`;
- a positive numeric `Books_Donated` value;
- a valid `Year_Month`.

Source quality summary:

- 818 total rows;
- 791 valid rows;
- 22 rows missing books and date;
- 3 rows missing date;
- 2 suspicious values excluded: `273,017,236` and `521,358,504`.

Only two individual months contain at least 24 valid records. Therefore, the adopted method is:

1. Sort valid records by `Year_Month`.
2. Preserve original source order within each month.
3. Take the most recent 192 valid records.
4. Split them sequentially into eight groups of 24.

DONA does not provide an exact donation date or time. Its hourly sequence is a repeatable game mapping, not a true historical hourly series.

Never publish donor names in the player interface, leaderboard or public export.

## 4. Price formulas

### Common price update

```text
NewPrice(d,h) = ROUND(PreviousPrice × (1 + AppliedReturn(d,h)), 2)
```

`CLAMP(value, lower, upper)` limits a calculated return to the specified lower and upper bounds.

### LIB formula — recommended, awaiting leader confirmation

```text
A_d = mean of the 24 LIB values for game day d

RawReturn(d,h)
= 0.05 × (CurrentLIB(d,h) − PreviousLIB(d,h)) ÷ A_d

AppliedReturn(d,h)
= CLAMP(RawReturn(d,h), −0.06, +0.06)
```

Current simulated result:

- median absolute hourly change: 0.85%;
- hourly cap hits: 4 of 184 movements;
- eight-day price range: M$90.87 to M$107.50;
- final price: M$105.01.

This is the only formula that is still labelled as a recommendation. The leader should confirm the 5% sensitivity and ±6% hourly cap before coding is frozen.

### BOOK formula — confirmed aggressive version

```text
A_d = mean of the 24 issue counts for game day d

RawReturn(d,h)
= 0.035 × (CurrentBOOK(d,h) − PreviousBOOK(d,h)) ÷ A_d

AppliedReturn(d,h)
= CLAMP(RawReturn(d,h), −0.05, +0.05)
```

Current simulated result:

- median absolute hourly change: 1.45%;
- hourly cap hits: 10 of 184 movements;
- eight-day price range: M$94.42 to M$110.72;
- final price: M$98.89.

### DONA formula — confirmed aggressive version

Donation records are highly skewed, so first transform each value:

```text
Y = LN(1 + Books_Donated)
A_d = mean of the 24 Y values for game day d

RawReturn(d,h)
= 0.045 × (CurrentY(d,h) − PreviousY(d,h)) ÷ A_d

AppliedReturn(d,h)
= CLAMP(RawReturn(d,h), −0.06, +0.06)
```

Current simulated result:

- median absolute hourly change: 2.26%;
- hourly cap hits: 25 of 184 movements;
- eight-day price range: M$100.00 to M$121.97;
- final price: M$110.87.

Do not remove the `LN(1+x)` transformation. Without it, extreme donation records repeatedly force identical limit-up or limit-down movements.

## 5. Missing values and safety rules

- Missing source data must not be converted to zero.
- If a required value or daily baseline is missing, non-numeric or not positive, freeze only that stock's price for that hour and alert the administrator.
- Preserve BOOK's real `issue = 0` observations.
- Keep a technical safety band of M$50 to M$200 for abnormal-input protection. The current three paths do not reach this band.
- The complete future path must be generated and checked before the game starts.
- Do not recalculate past prices silently after players have already traded.
- Any change to sensitivity or hourly caps requires regeneration and validation of all 192 quotations.

## 6. Spreadsheet and CSV structure

There are six completed data files: one Excel and one CSV for each stock.

Each file contains 192 rows and these 18 fields:

```text
stock_code
game_day
game_hour
game_time
source_period
source_date
source_sequence
raw_value
adjusted_value
baseline
previous_adjusted_value
raw_return
applied_return
open_price
close_price
cap_hit
source_status
admin_note
```

Excel files contain editable parameters and live formulas. CSV files contain the calculated results under the current parameters.

If an Excel parameter is changed, the existing CSV does not update automatically. Regenerate or export a new CSV after recalculation.

## 7. Privacy and anti-cheating requirements

The player-facing system may show:

- stock code;
- current price;
- current percentage change;
- current game time;
- the player's cash, holdings and total assets;
- leaderboard position and final assets.

The player-facing system must not show:

- original source dates;
- future rows or prices;
- future daily baselines;
- DONA donor names;
- the complete pre-generated path;
- administrator notes.

Only the administrator should have access to the original data, source periods, exclusions and complete future path.

## 8. Completed deliverables

The following deliverables have been completed:

- one Chinese design and formula PDF;
- one Excel workbook and one CSV file for LIB;
- one Excel workbook and one CSV file for BOOK;
- one Excel workbook and one CSV file for DONA.

The user will provide the files separately when they are needed. Do not ask for, guess or disclose the user's local file locations. Work only from the copies that the user attaches or shares in the receiving conversation.

## 9. Validation already completed

- PDF: 14 pages, no blank pages, no missing required sections and no visible clipping after final rendering.
- Each CSV: 192 data rows and 18 columns.
- Each Excel workbook: 192 data rows and 1,536 calculation-formula cells.
- Formula error scan completed during workbook generation.
- Excel formula results match the independently calculated CSV results.
- Confirmed final prices:
  - LIB: M$105.01
  - BOOK: M$98.89
  - DONA: M$110.87

## 10. Instructions for the next AI

1. Read this handoff first. Read the PDF and data files after the user provides them.
2. Treat BOOK and DONA formulas as confirmed unless the user explicitly changes them.
3. Treat the LIB formula as recommended and awaiting leader confirmation.
4. Do not add SCM, education points or market points without a new user request.
5. Do not expose source dates, future prices or donor identities to players.
6. Do not describe DONA as true hourly historical data.
7. If asked to code the game, wait for the user to provide the files. Use the supplied CSV copies as import-ready data and the supplied Excel copies to audit or adjust parameters.
8. Before accepting any parameter change, regenerate all 192 quotations and report the new median hourly movement, cap-hit count, minimum price, maximum price and final price.
9. Preserve the distinction between missing data and a real zero.
10. Explain any proposed change in beginner-friendly Chinese before implementing it.

## 11. Remaining decision

The only current approval item is:

```text
Confirm whether LIB should remain at 5.0% sensitivity with a ±6% hourly cap.
```

Do not treat that recommendation as final approval until the user or event负责人 confirms it.

## Sources

- LIB library gate-count source data, to be supplied by the user
- BOOK circulation transaction source data, to be supplied by the user
- DONA donation source data, to be supplied by the user
- Current Stock Market Game design discussion and confirmed user decisions

## Related

- [[MAT × Library Mathematics Week 2026]]
- [[Stock Market Game]]
- [[LIB]]
- [[BOOK]]
- [[DONA]]
