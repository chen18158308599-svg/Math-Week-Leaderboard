# Math Week Leaderboard

The six digital games now live in [digital-games](digital-games/README.md) and are built into the main website. Use `/games` to play and claim points. No separate Render deployment or Vite server is required.

```
npm ci
npm run dev
```

Production: `npm run build` then `npm start`. The build generates `public/digital-play` from game source before building Next.js. Generated files are not committed.

After editing game source during development, run `npm run build:digital-games` and reopen the iframe. Tests: `npm run test:digital-games` and `npm run test:digital-claims`.

See [migration and Supabase setup](new_instructions/arrangements/same_origin_game_migration.md).
