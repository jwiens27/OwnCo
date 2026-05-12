import type { AcquisitionMode } from "./types";

export type FieldKey =
  | "purchasePrice"
  | "propertyTaxAnnual"
  | "insuranceAnnual"
  | "hoaMonthly"
  | "maintenanceReserveAnnualPct"
  | "expectedAppreciationPct"
  | "mortgageRate"
  | "mortgageTermYears"
  | "ownerName"
  | "ownerDownPayment"
  | "occupancyType"
  | "liveInOwnerIndices"
  | "fairMarketRent"
  | "expectedMonthlyRent"
  | "externalMonthlyRent";

const purchaseLabels: Record<FieldKey, string> = {
  purchasePrice: "Purchase Price",
  propertyTaxAnnual: "Property Tax (annual)",
  insuranceAnnual: "Insurance (annual)",
  hoaMonthly: "HOA (monthly)",
  maintenanceReserveAnnualPct: "Maintenance Reserve",
  expectedAppreciationPct: "Expected Appreciation",
  mortgageRate: "Mortgage Rate (APR)",
  mortgageTermYears: "Loan Term",
  ownerName: "Name",
  ownerDownPayment: "Down Payment",
  occupancyType: "Occupancy Type",
  liveInOwnerIndices: "Live-in Owners",
  fairMarketRent: "Fair Market Rent",
  expectedMonthlyRent: "Expected Monthly Rent",
  externalMonthlyRent: "External Rental Income (monthly)",
};

const inheritanceLabels: Record<FieldKey, string> = {
  ...purchaseLabels,
  purchasePrice: "Current Fair Market Value",
  ownerDownPayment: "Inherited Equity Stake",
  mortgageRate: "Existing Mortgage Rate (0 if paid off)",
  mortgageTermYears: "Remaining Mortgage Term",
};

export const FIELD_LABELS: Record<AcquisitionMode, Record<FieldKey, string>> = {
  purchase: purchaseLabels,
  inheritance: inheritanceLabels,
};

const purchaseTips: Record<FieldKey, string> = {
  purchasePrice:
    "Agreed acquisition price before closing fees. Sizes the mortgage and drives appreciation projections.",
  propertyTaxAnnual:
    "Annual property tax. Pulled from the listing or county assessor. May reset to a higher figure on transfer.",
  insuranceAnnual:
    "Annual homeowner's insurance premium. Landlord policies cost more than owner-occupied.",
  hoaMonthly: "Monthly HOA, condo, or co-op fee. Enter 0 if none.",
  maintenanceReserveAnnualPct:
    "Annual maintenance reserve as a percent of property value. 1% is standard; older homes and rentals run 1.5–2%.",
  expectedAppreciationPct:
    "Assumed annual price appreciation. US long-run average is around 3%.",
  mortgageRate:
    "APR on the mortgage. The current 30-year average is roughly 6–7%; check live rates with a lender.",
  mortgageTermYears:
    "Loan length. 30 years is standard; shorter terms raise monthly cost but cut total interest sharply.",
  ownerName: "Display name in results, charts, and any shared link.",
  ownerDownPayment:
    "Cash this owner contributes. Determines their ownership share and monthly cost.",
  occupancyType:
    "Rented out = investment property. Owner-occupied = one or more co-owners live in it. Mixed = some space is lived in, the rest is rented.",
  liveInOwnerIndices:
    "Which owners live in the property. Each pays imputed rent (FMR ÷ live-in count) into the partnership; the partnership distributes that rent back to all owners by ownership share. Net effect: live-in owners pay only the portion of rent owed to non-occupying co-owners.",
  fairMarketRent:
    "What the property would rent for on the open market. Drives imputed rent flows.",
  expectedMonthlyRent:
    "Monthly rent collected from outside tenants.",
  externalMonthlyRent:
    "Monthly rent collected from rooms or units leased to non-owners.",
};

const inheritanceTips: Record<FieldKey, string> = {
  ...purchaseTips,
  purchasePrice:
    "Fair market value at the date of inheritance — your stepped-up basis. Use the estate appraisal.",
  ownerDownPayment:
    "This owner's inherited equity stake: (FMV − remaining mortgage) ÷ heirs for equal splits, or per the will / agreement.",
  mortgageRate:
    "Rate on the existing mortgage. Set to 0 if the home is paid off.",
  mortgageTermYears:
    "Years remaining on the existing mortgage. Use any positive number (e.g., 30) if the home is paid off — term has no effect on a $0 loan.",
};

export const TOOLTIP_COPY: Record<AcquisitionMode, Record<FieldKey, string>> = {
  purchase: purchaseTips,
  inheritance: inheritanceTips,
};
