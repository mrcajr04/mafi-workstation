This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Scenario Desk v2

Scenario Desk v2 lives at `/scenario-desk` and `/scenario-desk/[contactId]`.
The list route shows contacts in `IN_SCENARIO_REVIEW`; the detail route renders
the editable Scenario Desk for in-review contacts and a locked read-only view for
finalized contacts whose Scenario Desk is `FINALIZED` and whose contact has moved
to `IN_PROCESSING`.

Access to the working Scenario Desk is limited to `OWNER` and `LICENSED_LO`.
Unauthorized roles receive controlled access-denied UI, and server actions enforce
the same role boundary. Compliance/audit review remains separate from the editable
Scenario Desk route.

Required upstream data comes from Phase 1-2 intake:
`PropertyDetails.propertyTaxesPresentYear` or `propertyTaxesLastYear`,
`PropertyDetails.estimatedInsuranceAnnual`, `PropertyDetails.additionalHoaFees`,
and `OpportunityValue.comments`. Save Draft can persist scenarios and comments
without advancing workflow status. Finalize requires a selected real scenario and
a non-null annual insurance value; an explicitly stored `0` annual insurance is
valid.

P&I and PITIA calculations use `src/lib/mortgage/scenario-calculations.ts`.
The client calculates previews, but `src/lib/actions/scenario-actions.ts`
recalculates authoritatively before saving/finalizing. Finalize runs the Scenario
Desk update, scenario replacement, comments update, contact status transition,
Phase 4 create-if-missing, and `FINALIZE_SCENARIO_DESK` audit event inside one
Prisma transaction.

Finalized Scenario Desk pages display saved historical P&I/PITIA values from the
persisted Scenario rows and intentionally do not recalculate from current upstream
property values. Legacy Scenario columns such as numeric `loanTerm`,
`monthlyInsurance`, `originationPay`, `processingFee`, and `comments` remain for
compatibility and later destructive schema cleanup.

Deferred work: real amend/reopen, Active Lenders eligibility, server-generated
PDFs, and destructive removal of legacy schema fields.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
