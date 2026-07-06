import {
  AssetType,
  BorrowerType,
  ContactStatus,
  FicoSource,
  InsuranceType,
  LoanPurpose,
  OpportunityStatus,
  PrismaClient,
  PropertyType,
  RealtorStatus,
  RoleType,
} from "@prisma/client";

const prisma = new PrismaClient();

const emailTemplateSeeds = [
  {
    templateKey: "WELCOME",
    subject: "Welcome to MLG Financial",
    bodyHtml: `
      <p style="margin:0 0 16px;">Hi {{prospect_name}},</p>
      <p style="margin:0 0 16px;">
        Welcome to MLG Financial. We received your information and someone from our team will follow up to learn more about your mortgage goals and discuss available options.
      </p>
      <p style="margin:0 0 16px;">
        MLG Financial can help review a range of mortgage programs and potential benefits based on your situation. Any options discussed are informational and subject to eligibility, documentation, underwriting, and final approval.
      </p>
      <p style="margin:0 0 18px;color:#54595F;">Best,<br />MLG Financial</p>
      <hr style="border:0;border-top:1px solid #D8E4F0;margin:18px 0;" />
      <p style="margin:0 0 8px;color:#7A7A7A;font-size:12px;line-height:1.5;">
        If you'd rather not receive these emails, reply STOP or contact us at [placeholder email].
      </p>
      <p style="margin:0;color:#7A7A7A;font-size:12px;line-height:1.5;">
        [MLG Financial business address]
      </p>
    `.trim(),
  },
  {
    templateKey: "DISCOVERY_FOLLOW_UP",
    subject: "Checking in on your mortgage options",
    bodyHtml: `
      <p style="margin:0 0 16px;">Hi {{prospect_name}},</p>
      <p style="margin:0 0 16px;">
        Just checking in on your mortgage options. Happy to answer any questions whenever you're ready.
      </p>
      <p style="margin:0;color:#54595F;">Best,<br />MAFI Workstation</p>
    `.trim(),
  },
  {
    templateKey: "RE_ENGAGEMENT_FOLLOW_UP",
    subject: "Want to revisit your mortgage options?",
    bodyHtml: `
      <p style="margin:0 0 16px;">Hi {{prospect_name}},</p>
      <p style="margin:0 0 16px;">
        It's been a while. Rates and programs change often, so we're happy to revisit your options if the timing is better now.
      </p>
      <p style="margin:0;color:#54595F;">Best,<br />MAFI Workstation</p>
    `.trim(),
  },
];

const loanProductSeeds = [
  {
    lender: "Fannie Mae",
    loanType: "Conventional",
    loanSubtype: "Fixed 30yr - Standard",
    minFico: 620,
    maxLtv: "95.00",
    eligibleBorrowerTypes: "Primary,Second Home,Investment",
    eligiblePropertyTypes: "SFR,Condo,PUD",
    eligiblePurposes: "Purchase,Rate/Term Refi",
    description:
      "Standard conventional reference product for borrowers with established credit. Eligibility varies by occupancy, property type, reserves, and automated underwriting findings.",
  },
  {
    lender: "Fannie Mae",
    loanType: "Conventional",
    loanSubtype: "97 LTV First-Time Homebuyer",
    minFico: 620,
    maxLtv: "97.00",
    eligibleBorrowerTypes: "Primary",
    eligiblePropertyTypes: "SFR,Condo,PUD",
    eligiblePurposes: "Purchase,Rate/Term Refi",
    description:
      "Low down payment conventional reference option for eligible primary-residence borrowers. Intended as education only; first-time buyer and underwriting restrictions may apply.",
  },
  {
    lender: "Fannie Mae",
    loanType: "Conventional",
    loanSubtype: "HomeReady Fixed 30yr",
    minFico: 620,
    maxLtv: "97.00",
    eligibleBorrowerTypes: "Primary",
    eligiblePropertyTypes: "SFR,Condo,PUD",
    eligiblePurposes: "Purchase,Rate/Term Refi",
    description:
      "Affordable conventional reference product for eligible low-to-moderate income primary-residence borrowers, subject to income limits and underwriting approval.",
  },
  {
    lender: "Freddie Mac",
    loanType: "Conventional",
    loanSubtype: "Home Possible Fixed 30yr",
    minFico: 620,
    maxLtv: "97.00",
    eligibleBorrowerTypes: "Primary",
    eligiblePropertyTypes: "SFR,Condo,PUD",
    eligiblePurposes: "Purchase,Rate/Term Refi",
    description:
      "Affordable conventional reference product for eligible primary-residence borrowers, commonly used for low down payment scenarios with program-specific income and property rules.",
  },
  {
    lender: "Fannie Mae",
    loanType: "Conventional",
    loanSubtype: "Second Home",
    minFico: 680,
    maxLtv: "90.00",
    eligibleBorrowerTypes: "Second Home",
    eligiblePropertyTypes: "SFR,Condo,PUD",
    eligiblePurposes: "Purchase,Rate/Term Refi",
    description:
      "Conventional reference product for second-home occupancy. Typically has tighter credit, reserve, and LTV expectations than primary residence financing.",
  },
  {
    lender: "Fannie Mae",
    loanType: "Conventional",
    loanSubtype: "Investment Property",
    minFico: 680,
    maxLtv: "85.00",
    eligibleBorrowerTypes: "Investment",
    eligiblePropertyTypes: "SFR,Condo,PUD",
    eligiblePurposes: "Purchase,Rate/Term Refi,Cash-Out Refi",
    description:
      "Conventional reference product for non-owner-occupied properties. Investment loans often require stronger credit, reserves, and lower LTV than owner-occupied scenarios.",
  },
  {
    lender: "FHA",
    loanType: "FHA",
    loanSubtype: "Fixed 30yr",
    minFico: 580,
    maxLtv: "96.50",
    eligibleBorrowerTypes: "Primary",
    eligiblePropertyTypes: "SFR,Condo,PUD,Manufactured",
    eligiblePurposes: "Purchase,Rate/Term Refi",
    description:
      "FHA-insured reference product with flexible credit characteristics for eligible primary residences. Mortgage insurance and FHA property standards apply.",
  },
  {
    lender: "FHA",
    loanType: "FHA",
    loanSubtype: "Streamline Refi",
    minFico: 580,
    maxLtv: "97.75",
    eligibleBorrowerTypes: "Primary",
    eligiblePropertyTypes: "SFR,Condo,PUD",
    eligiblePurposes: "Rate/Term Refi",
    description:
      "Reference refinance option for existing FHA borrowers. Streamline refinances may reduce documentation compared with a full refinance, subject to FHA and lender rules.",
  },
  {
    lender: "FHA",
    loanType: "FHA",
    loanSubtype: "Cash-Out Refi",
    minFico: 580,
    maxLtv: "80.00",
    eligibleBorrowerTypes: "Primary",
    eligiblePropertyTypes: "SFR,Condo,PUD",
    eligiblePurposes: "Cash-Out Refi",
    description:
      "FHA cash-out refinance reference product for eligible primary residences. Equity, occupancy, seasoning, and underwriting requirements apply.",
  },
  {
    lender: "VA",
    loanType: "VA",
    loanSubtype: "Purchase",
    minFico: 0,
    maxLtv: "100.00",
    eligibleBorrowerTypes: "Primary",
    eligiblePropertyTypes: "SFR,Condo,PUD",
    eligiblePurposes: "Purchase",
    description:
      "VA-guaranteed reference product for eligible Veterans, service members, and surviving spouses. VA does not set a minimum credit score, though lenders may apply overlays.",
  },
  {
    lender: "VA",
    loanType: "VA",
    loanSubtype: "IRRRL Streamline Refi",
    minFico: 0,
    maxLtv: "100.00",
    eligibleBorrowerTypes: "Primary",
    eligiblePropertyTypes: "SFR,Condo,PUD",
    eligiblePurposes: "Rate/Term Refi",
    description:
      "VA Interest Rate Reduction Refinance Loan reference product for eligible existing VA borrowers. Designed for simplified rate/term refinance scenarios.",
  },
  {
    lender: "USDA Rural Development",
    loanType: "USDA",
    loanSubtype: "Guaranteed Fixed 30yr",
    minFico: 640,
    maxLtv: "100.00",
    eligibleBorrowerTypes: "Primary",
    eligiblePropertyTypes: "SFR,PUD",
    eligiblePurposes: "Purchase",
    description:
      "USDA guaranteed loan reference product for eligible rural properties and income-qualified primary-residence borrowers. Many lenders use 640 as a practical automated-underwriting benchmark.",
  },
  {
    lender: "Portfolio Lender",
    loanType: "Jumbo",
    loanSubtype: "Fixed 30yr",
    minFico: 700,
    maxLtv: "80.00",
    eligibleBorrowerTypes: "Primary,Second Home",
    eligiblePropertyTypes: "SFR,Condo,PUD",
    eligiblePurposes: "Purchase,Rate/Term Refi",
    description:
      "Jumbo reference product for loan amounts above conforming limits. Typical scenarios require stronger credit, reserves, and full documentation.",
  },
  {
    lender: "Portfolio Lender",
    loanType: "Jumbo",
    loanSubtype: "ARM 5/1",
    minFico: 720,
    maxLtv: "80.00",
    eligibleBorrowerTypes: "Primary,Second Home",
    eligiblePropertyTypes: "SFR,Condo,PUD",
    eligiblePurposes: "Purchase,Rate/Term Refi",
    description:
      "Jumbo adjustable-rate reference product for qualified borrowers seeking an initial fixed-rate period. Rate adjustment, reserves, and investor requirements vary.",
  },
  {
    lender: "Portfolio Lender",
    loanType: "Jumbo",
    loanSubtype: "Cash-Out Refi",
    minFico: 720,
    maxLtv: "70.00",
    eligibleBorrowerTypes: "Primary,Second Home",
    eligiblePropertyTypes: "SFR,Condo,PUD",
    eligiblePurposes: "Cash-Out Refi",
    description:
      "Jumbo cash-out reference product for higher-balance loans. Cash-out, reserve, and credit overlays are commonly more conservative than conforming products.",
  },
];

const seedContacts = [
  {
    prospectName: "SEED_Test Prospect 1",
    prospectPhone: "555-0101",
    prospectEmail: "SEED_test.prospect1@example.test",
    borrowerType: BorrowerType.PRIMARY,
    loanPurpose: LoanPurpose.PURCHASE,
    vesting: "Individuals",
    coBorrowers: [
      {
        name: "SEED_Co Borrower 1A",
        phone: "555-1101",
        email: "SEED_coborrower1a@example.test",
        order: 1,
      },
    ],
    assets: [
      { type: AssetType.CHECKING, amount: "18000.00", notes: "SEED checking" },
      { type: AssetType.GIFT, amount: "12000.00", notes: "SEED family gift" },
    ],
    ficoInfo: { source: FicoSource.KNOWN_CREDIT_KARMA, score: 718 },
    propertyDetails: {
      address: "SEED_1201 Palm Grove Ave, Orlando, FL 32801",
      propertyType: PropertyType.SFR,
      propertyTaxesLastYear: "5200.00",
      propertyTaxesPresentYear: "5450.00",
      insuranceType: InsuranceType.HAZARD_HO3,
      hoaName: "SEED_Palm Grove HOA",
      hoaManagementInfo: "SEED_Brightline Management",
      additionalHoaFees: "125.00",
    },
  },
  {
    prospectName: "SEED_Test Prospect 2",
    prospectPhone: "555-0102",
    prospectEmail: "SEED_test.prospect2@example.test",
    borrowerType: BorrowerType.SECOND_HOME,
    loanPurpose: LoanPurpose.RATE_TERM_REFI,
    vesting: "LLC / Corp",
    coBorrowers: [],
    assets: [
      { type: AssetType.SAVINGS, amount: "42000.00", notes: "SEED savings" },
    ],
    ficoInfo: { source: FicoSource.UNKNOWN, score: null },
    propertyDetails: {
      address: "SEED_88 Harbor View Dr, Tampa, FL 33602",
      propertyType: PropertyType.CONDO,
      propertyTaxesLastYear: "6100.00",
      propertyTaxesPresentYear: "6325.00",
      insuranceType: InsuranceType.WALL_IN_HO6,
      hoaName: "SEED_Harbor View Condo Association",
      hoaManagementInfo: "SEED_Coastal Property Services",
      additionalHoaFees: "410.00",
    },
  },
  {
    prospectName: "SEED_Test Prospect 3",
    prospectPhone: "555-0103",
    prospectEmail: "SEED_test.prospect3@example.test",
    borrowerType: BorrowerType.INVESTMENT,
    loanPurpose: LoanPurpose.CASH_OUT_REFI,
    vesting: "Trust",
    coBorrowers: [
      {
        name: "SEED_Co Borrower 3A",
        phone: "555-1301",
        email: "SEED_coborrower3a@example.test",
        order: 1,
      },
      {
        name: "SEED_Co Borrower 3B",
        phone: "555-1302",
        email: "SEED_coborrower3b@example.test",
        order: 2,
      },
    ],
    assets: [
      {
        type: AssetType.RETIREMENT,
        amount: "95000.00",
        notes: "SEED retirement account",
      },
      { type: AssetType.CHECKING, amount: "25000.00", notes: "SEED checking" },
    ],
    ficoInfo: { source: FicoSource.KNOWN_BANK, score: 742 },
    propertyDetails: {
      address: "SEED_2400 Coral Way, Miami, FL 33145",
      propertyType: PropertyType.PUD_TOWNHOUSE,
      propertyTaxesLastYear: "7800.00",
      propertyTaxesPresentYear: "8100.00",
      insuranceType: InsuranceType.INVESTOR_DP3,
      hoaName: "SEED_Coral Way Townhomes",
      hoaManagementInfo: "SEED_Sunstate HOA Group",
      additionalHoaFees: "225.00",
    },
  },
  {
    prospectName: "SEED_Test Prospect 4",
    prospectPhone: "555-0104",
    prospectEmail: "SEED_test.prospect4@example.test",
    borrowerType: BorrowerType.PRIMARY,
    loanPurpose: LoanPurpose.LIMITED_CASH_OUT,
    vesting: "Individuals",
    coBorrowers: [
      {
        name: "SEED_Co Borrower 4A",
        phone: "555-1401",
        email: "SEED_coborrower4a@example.test",
        order: 1,
      },
    ],
    assets: [
      { type: AssetType.OTHER, amount: "15000.00", notes: "SEED brokerage" },
    ],
    ficoInfo: { source: FicoSource.ESTIMATED_GUESS, score: 680 },
    propertyDetails: {
      address: "SEED_510 Lake Meadow Rd, Jacksonville, FL 32207",
      propertyType: PropertyType.PUD_VILLA,
      propertyTaxesLastYear: "4300.00",
      propertyTaxesPresentYear: "4475.00",
      insuranceType: InsuranceType.FLOOD,
      hoaName: "SEED_Lake Meadow Villas",
      hoaManagementInfo: "SEED_First Coast Management",
      additionalHoaFees: "185.00",
    },
    opportunityValue: {
      propertyValue: "390000.00",
      purchasePrice: "0.00",
      loanAmount: "260000.00",
      hasRealtor: RealtorStatus.NO,
      calculatedOpportunityValue: "260000.00",
      ltv: "66.67",
      status: OpportunityStatus.NOT_DECIDED,
      notMovingForwardReason: null,
    },
  },
  {
    prospectName: "SEED_Test Prospect 5",
    prospectPhone: "555-0105",
    prospectEmail: "SEED_test.prospect5@example.test",
    borrowerType: BorrowerType.OTHER,
    loanPurpose: LoanPurpose.PURCHASE,
    vesting: "LLC / Corp",
    coBorrowers: [],
    assets: [
      { type: AssetType.SAVINGS, amount: "65000.00", notes: "SEED savings" },
      { type: AssetType.CHECKING, amount: "22000.00", notes: "SEED checking" },
    ],
    ficoInfo: { source: FicoSource.UNKNOWN, score: null },
    propertyDetails: {
      address: "SEED_730 Commerce Park Blvd, Fort Lauderdale, FL 33301",
      propertyType: PropertyType.COMMERCIAL,
      propertyTaxesLastYear: "11800.00",
      propertyTaxesPresentYear: "12150.00",
      insuranceType: InsuranceType.MASTER_INSURANCE,
      hoaName: "SEED_Commerce Park Association",
      hoaManagementInfo: "SEED_Atlantic Commercial Management",
      additionalHoaFees: "525.00",
    },
    opportunityValue: {
      propertyValue: "875000.00",
      purchasePrice: "850000.00",
      loanAmount: "680000.00",
      hasRealtor: RealtorStatus.YES,
      calculatedOpportunityValue: "680000.00",
      ltv: "77.71",
      status: OpportunityStatus.READY_FOR_REVIEW,
      notMovingForwardReason: null,
    },
  },
];

async function main() {
  await prisma.automationSettings.upsert({
    where: {
      id: "singleton",
    },
    update: {},
    create: {
      id: "singleton",
    },
  });

  for (const template of emailTemplateSeeds) {
    await prisma.emailTemplate.upsert({
      where: {
        templateKey: template.templateKey,
      },
      update: {},
      create: template,
    });
  }

  for (const loanProduct of loanProductSeeds) {
    const existingLoanProduct = await prisma.loanProduct.findFirst({
      where: {
        lender: loanProduct.lender,
        loanType: loanProduct.loanType,
        loanSubtype: loanProduct.loanSubtype,
      },
    });

    if (existingLoanProduct) {
      await prisma.loanProduct.update({
        where: {
          id: existingLoanProduct.id,
        },
        data: loanProduct,
      });
    } else {
      await prisma.loanProduct.create({
        data: loanProduct,
      });
    }
  }

  const bdr = await prisma.profile.findFirst({
    where: {
      role: RoleType.BDR,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!bdr) {
    throw new Error(
      "No BDR Profile found. Create or invite a BDR account first, then re-run `npx prisma db seed`.",
    );
  }

  const createdContacts = [];

  for (const seedContact of seedContacts) {
    const status = seedContact.opportunityValue?.status === OpportunityStatus.READY_FOR_REVIEW
      ? ContactStatus.IN_SCENARIO_REVIEW
      : ContactStatus.ACTIVE;

    const contact = await prisma.contact.create({
      data: {
        bdrId: bdr.id,
        status,
        prospectName: seedContact.prospectName,
        prospectPhone: seedContact.prospectPhone,
        prospectEmail: seedContact.prospectEmail,
        borrowerType: seedContact.borrowerType,
        loanPurpose: seedContact.loanPurpose,
        vesting: seedContact.vesting,
        coBorrowers: {
          create: seedContact.coBorrowers,
        },
        assets: {
          create: seedContact.assets,
        },
        ficoInfo: {
          create: seedContact.ficoInfo,
        },
        propertyDetails: {
          create: seedContact.propertyDetails,
        },
        opportunityValue: seedContact.opportunityValue
          ? {
              create: seedContact.opportunityValue,
            }
          : undefined,
      },
      include: {
        opportunityValue: true,
      },
    });

    createdContacts.push(contact);
  }

  const withoutOpportunityValue = createdContacts.filter(
    (contact) => !contact.opportunityValue,
  );
  const withOpportunityValue = createdContacts.filter(
    (contact) => contact.opportunityValue,
  );

  console.log(`Seeded ${createdContacts.length} contacts for BDR ${bdr.email}.`);
  console.log("");
  console.log("Contacts without OpportunityValue:");
  withoutOpportunityValue.forEach((contact) => {
    console.log(`- ${contact.id} | ${contact.prospectName}`);
  });
  console.log("");
  console.log("Contacts with OpportunityValue:");
  withOpportunityValue.forEach((contact) => {
    console.log(
      `- ${contact.id} | ${contact.prospectName} | status=${contact.opportunityValue?.status}`,
    );
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
