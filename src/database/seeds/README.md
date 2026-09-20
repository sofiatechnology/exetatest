# 1. SCIENTIFIQUE



- **2015 langues (legacy)**
```bash
npx ts-node --transpile-only --project tsconfig.json -r tsconfig-paths/register src/database/seeds/scientifique/scientifique-2015.ts
```

## Lookup collection (Scientifique)

1. Refresh collected JSON from Schoolap + local dumps:
```bash
npm run lookup:collect
```

2. Insert collected questions (skips courses that already exist):
```bash
npm run seed:items
npm run seed:lookup
```

