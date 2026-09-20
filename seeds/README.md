# Seeds

All seed runners and seed data live in `src/database/seeds/`.

```bash
npm run seed:items      # items for every section/year/type
npm run seed:courses    # placeholder courses + questions
npm run seed:lookup     # collected EXETAT papers
npm run seed:cleanup    # remove pre-2015 rows
npm run seed:all        # items + courses + lookup
```

## Scientifique

- **2015 langues (legacy)**
```bash
npx ts-node --transpile-only --project tsconfig.json -r tsconfig-paths/register src/database/seeds/scientifique/scientifique-2015.ts
```

## Lookup collection (Scientifique)

Collected papers: `src/database/seeds/lookup/collected/`.

```bash
npm run lookup:collect
npm run seed:items
npm run seed:lookup
```

