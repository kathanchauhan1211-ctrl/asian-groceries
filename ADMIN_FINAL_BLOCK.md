# ADMIN FINAL BLOCK
## Governance Rules — Asian Groceries Admin Portal

> Single source of truth for how the admin portal is built, connected, and extended.

## GOLDEN RULES
1. Do NOT touch working things. Only modify files directly in scope.
2. Firestore is always updated to match new features — schema first, then code.
3. No mock, no stub, no fake data in pipelines. End-to-end or nothing.
4. Admin controls the storefront as God — every storefront feature has an admin controller.
5. No dumb data saved — validate on client AND API route before any Firestore write.
6. Commit only when everything works — pnpm build must pass with zero errors.
7. Each feature has ONE named pipeline — pipelines do not overlap.
8. Tabs on top: admin layout is always a horizontal tab bar (top), full content below. Desktop and mobile both use tabs — mobile scrolls horizontally.

## PIPELINE REGISTRY
| Pipeline | Admin Writes To | Storefront Hook |
|---|---|---|
| product-pipeline | products/{id} | useProducts() |
| category-filter-pipeline | settings/categoryFilters | useCategoryFilters() |
| slides-pipeline | slides/{id} | useSlides() |
| offers-pipeline | offers/{id} | useOffers() |
| collections-pipeline | collections/{id} | useCollections() |
| settings-pipeline | settings/store | useStoreSettings() |
| orders-pipeline | orders/ (Admin SDK only) | /api/admin/orders |

## FIRESTORE RULES FOR NEW COLLECTIONS
Every new collection: allow read: if true; allow write: if isAdmin();
Orders collection: Admin SDK server-side only, never client SDK writes.

> ⚠️ MANDATORY: Every time a new Firestore collection is added OR a new feature writes to Firestore,
> the developer MUST add the matching rule to `firestore.rules` AND deploy it immediately via:
>   `firebase deploy --only firestore:rules`
> Failure to do this causes `permission-denied` errors on the storefront.
> Rules are NOT automatically deployed — they must be pushed manually every time.

## CURRENT RULES STATUS
| Collection       | Rule in file | Deployed |
|-----------------|-------------|---------|
| products         | ✅           | ✅       |
| orders           | ✅           | ✅       |
| users            | ✅           | ✅       |
| offers           | ✅           | ✅       |
| slides           | ✅           | ✅       |
| collections      | ✅           | ✅       |
| settings         | ✅           | ❓ Run `firebase deploy --only firestore:rules` |
| shopCategories   | ✅           | ❓ Run `firebase deploy --only firestore:rules` |

## NEVER ALLOWED
- Committing TODO in pipeline code
- Using `as any` without a type guard in Firestore reads
- Saving empty/null id, label, or match for filter categories
- Client SDK writes to orders collection
- Deploying without pnpm build passing
- Debug console.log in production pipeline code
- Adding a new Firestore collection without updating AND deploying firestore.rules
