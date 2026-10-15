# heads-up

this file is only for making up information that is missing in `C:\Users\LENOVO\Desktop\Math-Week-Leaderboard\mat_stock_market\instructions\MAT_Library_Math_Week_2026_Stock_Market_Data_Formula_Conclusion_EN.pdf` as an rough explanation of how this game work, if there is any differences between decisions and details, we should follow `C:\Users\LENOVO\Desktop\Math-Week-Leaderboard\mat_stock_market\instructions\MAT_Library_Math_Week_2026_Stock_Market_Data_Formula_Conclusion_EN.pdf` but not this file.

# pointing system

base points per mode — proposed Card placard 10, Digital 15, Code (Interactive) 20, Committee booth 20.

# other info

Points earned at booths are the “money” traded on the Stock Market (Days 1–6). When trading closes on Day 7 the final portfolio value is converted back into leaderboard points, so market performance feeds the same standings rather than a separate contest. Decision: conversion rate from final portfolio value to points, and whether the market can lower a participant’s standing below their booth points. 

# overview

A simulated stock-trading game running on the Math Week website. Participants earn “money” by playing booths, then invest it in 5 indices built from real school data. Rankings are by total portfolio value. Participants can email the committee for any verification. 

Technical formulas and rules are in the Technical Specification table below. 

# joining flow

No guests. Scan QR to join with Student ID or email. Four UI buttons: Leaderboard, Profile, Stock Market, History. 

Do leaderboard users have to log in with the school email? Alternatively verify, then give a nickname (nicknames supervised by Admin in case of inappropriate names). 

The system builds a participant_id; the profile page shows a personal QR and the stocks bought. 

Stock Market: interact with the different stocks and see the information for each. 

History: the record of the participant’s “money”. 

# earning money at booths

After joining, participants go to booths and play games. 

Digital booths: the platform records completion and marks correctness automatically. 

Physical booths: staff scan the participant’s QR and select the configured outcome. 

History immediately shows the points added, and what was learned / progress toward theme badges? 

Each activity has its own ID, so its base points can be earned only once; repeated scans show “already done” instead of awarding points again. 

# getting started

On first entering the Stock Market a “Market Brief” appears — a beginner’s guide explaining the stocks. It has no answers and does not affect rankings. 

Participants compare data, then choose to buy or sell. 

The trade confirmation page shows units, price, handling fee, remaining cash and post-trade positions. 

# trading rules

Everyone starts with $5000 and no holdings. 

Whole units only; minimum trade is 1 unit. 

Long-only: no short selling, borrowing/margin, derivatives, transfers, gifts or P2P trading (没有做空、借贷/杠杆/衍生品、转让、赠送或 P2P 交易). 

1% fee per trade, minimum $1 (see formulas below). 

One confirmed action per index per day (buy, sell or hold) — at most 5 decisions a day; no buying and selling the same index on the same day. 