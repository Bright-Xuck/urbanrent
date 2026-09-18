// ============================================================
// URBANRENT — DEVELOPMENT SEED
// ============================================================
// Dummy data for local/demo use. It is ADDITIVE: it never deletes a row.
//
//   * demo users and the amenity catalog are UPSERTED by their unique column
//     (email / name), so re-running the script is safe
//   * the demo listings — and the applications and viewing requests that
//     point at them — are only created when the properties table is EMPTY.
//     If you already have properties, those blocks are skipped entirely.
//
// Demo accounts all share the password below (see the summary it prints):
//
//   admin@urbanrent.cm       ADMIN
//   landlord1@urbanrent.cm   LANDLORD   (Ngwa Emmanuel)
//   landlord2@urbanrent.cm   LANDLORD   (Bella Nfor)
//   landlord3@urbanrent.cm   LANDLORD   (Tabe Charles)
//   tenant1@urbanrent.cm     TENANT     (Ama Ndive)
//   tenant2@urbanrent.cm     TENANT     (Junior Fon)
//   tenant3@urbanrent.cm     TENANT     (Mercy Enow)
//
// Run with:  pnpm --filter backend db:seed
// ============================================================

import bcrypt from "bcryptjs";
import prisma from "../src/config/prisma.js";
import {
  ApplicationStatus,
  PropertyStatus,
  PropertyType,
  Role,
  VerificationState,
  ViewingRequestStatus,
} from "../generated/prisma/enums.js";

// Every demo account gets this password (hashed in the DB, never stored plain).
const PASSWORD = "Password123!";

const DAY = 24 * 60 * 60 * 1000;

// A date N days in the past, at a fixed hour, so "newest first" ordering on
// the listing page actually looks like a real history.
function daysAgo(days: number, hour = 9): Date {
  const date = new Date(Date.now() - days * DAY);
  date.setHours(hour, 0, 0, 0);
  return date;
}

// A future timestamp for proposed / confirmed viewing times.
function daysAhead(days: number, hour = 10): Date {
  const date = new Date(Date.now() + days * DAY);
  date.setHours(hour, 0, 0, 0);
  return date;
}

// ------------------------------------------------------------
// Seed shapes
// ------------------------------------------------------------
type UserSeed = {
  email: string;
  role: Role;
  /** Landlords/admin are verified; tenants are not. */
  verified: boolean;
};

type PropertySeed = {
  /** Used to link applications/viewings back to this row, and to name photos. */
  slug: string;
  owner: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  sizeSqm: number;
  city: string;
  neighborhood: string;
  address: string;
  latitude: number;
  longitude: number;
  monthlyRent: number;
  cautionFee: number;
  status: PropertyStatus;
  amenities: string[];
  photos: number;
};

type ApplicationSeed = {
  tenant: string;
  property: string;
  status: ApplicationStatus;
  note: string;
  submittedDaysAgo: number;
};

type ViewingSeed = {
  tenant: string;
  property: string;
  status: ViewingRequestStatus;
  proposedTimes: string[];
  confirmedTime?: string;
  requestedDaysAgo: number;
};

// ------------------------------------------------------------
// Users
// ------------------------------------------------------------
const USERS: UserSeed[] = [
  { email: "admin@urbanrent.cm", role: Role.ADMIN, verified: true },
  { email: "landlord1@urbanrent.cm", role: Role.LANDLORD, verified: true },
  { email: "landlord2@urbanrent.cm", role: Role.LANDLORD, verified: true },
  { email: "landlord3@urbanrent.cm", role: Role.LANDLORD, verified: true },
  { email: "tenant1@urbanrent.cm", role: Role.TENANT, verified: false },
  { email: "tenant2@urbanrent.cm", role: Role.TENANT, verified: false },
  { email: "tenant3@urbanrent.cm", role: Role.TENANT, verified: false },
];

// ------------------------------------------------------------
// Amenity catalog (shared — one row per feature, linked to many properties)
// ------------------------------------------------------------
const AMENITIES: string[] = [
  "WiFi",
  "Borehole water",
  "Prepaid meter",
  "Backup generator",
  "Parking space",
  "Fenced compound",
  "Security guard",
  "Air conditioning",
  "Tiled floors",
  "Kitchen cabinets",
  "Balcony",
  "Water heater",
  "Garden",
  "Servant quarters",
];

// ------------------------------------------------------------
// Listings
// ------------------------------------------------------------
// Mixed statuses on purpose so the dashboard's status controls have
// something to show, and enough PUBLISHED rows to page through.
const PROPERTIES: PropertySeed[] = [
  {
    slug: "molyko-2bed-apartment",
    owner: "landlord1@urbanrent.cm",
    title: "2-bedroom apartment in Molyko",
    description:
      "Bright first-floor apartment a short walk from the UB junction. Fitted kitchen, tiled throughout, and a borehole so water is never a problem. Prepaid meter means you only pay for what you use.",
    propertyType: PropertyType.APARTMENT,
    bedrooms: 2,
    bathrooms: 1,
    sizeSqm: 84,
    city: "Buea",
    neighborhood: "Molyko",
    address: "Molyko, near UB Junction",
    latitude: 4.1528,
    longitude: 9.29,
    monthlyRent: 75000,
    cautionFee: 150000,
    status: PropertyStatus.PUBLISHED,
    amenities: ["WiFi", "Borehole water", "Prepaid meter", "Tiled floors", "Kitchen cabinets", "Parking space"],
    photos: 4,
  },
  {
    slug: "bomaka-3bed-house",
    owner: "landlord1@urbanrent.cm",
    title: "3-bedroom family house in Bomaka",
    description:
      "Standalone house in a quiet, fenced compound with room for two cars. All bedrooms are en-suite, and there is a servant quarter at the back. Good for a family that wants space and privacy.",
    propertyType: PropertyType.HOUSE,
    bedrooms: 3,
    bathrooms: 2,
    sizeSqm: 140,
    city: "Buea",
    neighborhood: "Bomaka",
    address: "Bomaka, off Malingo Street",
    latitude: 4.135,
    longitude: 9.276,
    monthlyRent: 150000,
    cautionFee: 300000,
    status: PropertyStatus.PUBLISHED,
    amenities: ["Fenced compound", "Parking space", "Security guard", "Borehole water", "Garden", "Servant quarters"],
    photos: 5,
  },
  {
    slug: "great-soppo-studio",
    owner: "landlord1@urbanrent.cm",
    title: "Self-contained studio in Great Soppo",
    description:
      "Neat single-room studio with its own kitchenette and bathroom. Walking distance to the Soppo market and the main motor park. Ideal for one person or a student couple.",
    propertyType: PropertyType.STUDIO,
    bedrooms: 1,
    bathrooms: 1,
    sizeSqm: 36,
    city: "Buea",
    neighborhood: "Great Soppo",
    address: "Great Soppo, near the market",
    latitude: 4.166,
    longitude: 9.284,
    monthlyRent: 40000,
    cautionFee: 80000,
    status: PropertyStatus.PUBLISHED,
    amenities: ["Prepaid meter", "Borehole water", "Tiled floors"],
    photos: 3,
  },
  {
    slug: "mile16-4bed-duplex",
    owner: "landlord1@urbanrent.cm",
    title: "4-bedroom duplex at Mile 16",
    description:
      "Newly finished duplex with a large sitting room, a separate dining area and a study. Still being painted — photos coming once the finishing touches are done.",
    propertyType: PropertyType.VILLA,
    bedrooms: 4,
    bathrooms: 3,
    sizeSqm: 220,
    city: "Buea",
    neighborhood: "Mile 16",
    address: "Mile 16, Buea",
    latitude: 4.118,
    longitude: 9.312,
    monthlyRent: 350000,
    cautionFee: 700000,
    status: PropertyStatus.DRAFT,
    amenities: ["Parking space", "Fenced compound", "Air conditioning", "Water heater"],
    photos: 2,
  },
  {
    slug: "bonapriso-3bed-apartment",
    owner: "landlord2@urbanrent.cm",
    title: "3-bedroom apartment in Bonapriso",
    description:
      "Serviced apartment in one of Douala's most convenient quarters. Air-conditioned bedrooms, a standby generator for the whole block, and a resident caretaker.",
    propertyType: PropertyType.APARTMENT,
    bedrooms: 3,
    bathrooms: 2,
    sizeSqm: 120,
    city: "Douala",
    neighborhood: "Bonapriso",
    address: "Rue Njo-Njo, Bonapriso",
    latitude: 4.023,
    longitude: 9.708,
    monthlyRent: 285000,
    cautionFee: 500000,
    status: PropertyStatus.PUBLISHED,
    amenities: ["Air conditioning", "Backup generator", "Security guard", "Parking space", "Water heater", "Balcony"],
    photos: 5,
  },
  {
    slug: "bonamoussadi-2bed",
    owner: "landlord2@urbanrent.cm",
    title: "2-bedroom apartment in Bonamoussadi",
    description:
      "Second-floor apartment with a balcony over the street. Two minutes from the Bonamoussadi market and well connected to Ndokotti. Prepaid meter installed.",
    propertyType: PropertyType.APARTMENT,
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 96,
    city: "Douala",
    neighborhood: "Bonamoussadi",
    address: "Bonamoussadi, Ndokotti side",
    latitude: 4.079,
    longitude: 9.735,
    monthlyRent: 180000,
    cautionFee: 360000,
    status: PropertyStatus.PUBLISHED,
    amenities: ["Balcony", "Prepaid meter", "Tiled floors", "Kitchen cabinets", "Parking space"],
    photos: 4,
  },
  {
    slug: "akwa-shop-space",
    owner: "landlord2@urbanrent.cm",
    title: "Shop space in Akwa",
    description:
      "Ground-floor commercial space on a busy street with heavy foot traffic. Roller shutter frontage, small store room at the back, and a toilet. Suits a boutique, pharmacy or phone shop.",
    propertyType: PropertyType.COMMERCIAL,
    bedrooms: 0,
    bathrooms: 1,
    sizeSqm: 110,
    city: "Douala",
    neighborhood: "Akwa",
    address: "Akwa, near the central market",
    latitude: 4.051,
    longitude: 9.702,
    monthlyRent: 420000,
    cautionFee: 840000,
    status: PropertyStatus.PUBLISHED,
    amenities: ["Prepaid meter", "Security guard", "Backup generator"],
    photos: 2,
  },
  {
    slug: "bastos-4bed-villa",
    owner: "landlord3@urbanrent.cm",
    title: "4-bedroom villa in Bastos",
    description:
      "Detached villa in the diplomatic quarter with a mature garden, a double garage and staff quarters. Fully air-conditioned, with a solar water heater and a 15 kVA generator.",
    propertyType: PropertyType.VILLA,
    bedrooms: 4,
    bathrooms: 4,
    sizeSqm: 300,
    city: "Yaounde",
    neighborhood: "Bastos",
    address: "Avenue Charles de Gaulle, Bastos",
    latitude: 3.89,
    longitude: 11.518,
    monthlyRent: 600000,
    cautionFee: 1200000,
    status: PropertyStatus.PUBLISHED,
    amenities: [
      "Garden",
      "Security guard",
      "Backup generator",
      "Air conditioning",
      "Water heater",
      "Parking space",
      "Servant quarters",
      "Fenced compound",
    ],
    photos: 5,
  },
  {
    slug: "nsimeyong-2bed",
    owner: "landlord3@urbanrent.cm",
    title: "2-bedroom apartment in Nsimeyong",
    description:
      "Compact apartment in a quiet residential street, with a shared yard and parking for one car. Good value for the quarter and close to the Nsimeyong junction.",
    propertyType: PropertyType.APARTMENT,
    bedrooms: 2,
    bathrooms: 1,
    sizeSqm: 78,
    city: "Yaounde",
    neighborhood: "Nsimeyong",
    address: "Nsimeyong, near the junction",
    latitude: 3.845,
    longitude: 11.503,
    monthlyRent: 120000,
    cautionFee: 240000,
    status: PropertyStatus.PUBLISHED,
    amenities: ["Prepaid meter", "Parking space", "Tiled floors", "Borehole water"],
    photos: 3,
  },
  {
    slug: "limbe-mile4-house",
    owner: "landlord3@urbanrent.cm",
    title: "3-bedroom house near Mile 4 beach",
    description:
      "Breezy house a few minutes from the Mile 4 seafront. Large veranda, walled compound and space for a small garden. Temporarily off the market while the roof is being redone.",
    propertyType: PropertyType.HOUSE,
    bedrooms: 3,
    bathrooms: 2,
    sizeSqm: 160,
    city: "Limbe",
    neighborhood: "Mile 4",
    address: "Mile 4, Limbe",
    latitude: 4.019,
    longitude: 9.201,
    monthlyRent: 200000,
    cautionFee: 400000,
    status: PropertyStatus.UNPUBLISHED,
    amenities: ["Fenced compound", "Garden", "Borehole water", "Parking space"],
    photos: 3,
  },
  {
    slug: "nkwen-studio",
    owner: "landlord1@urbanrent.cm",
    title: "Studio apartment in Nkwen",
    description:
      "Old listing kept for the record. Studio with a shared kitchen, close to the Nkwen market. The landlord has since let it out on a long lease.",
    propertyType: PropertyType.STUDIO,
    bedrooms: 1,
    bathrooms: 1,
    sizeSqm: 32,
    city: "Bamenda",
    neighborhood: "Nkwen",
    address: "Nkwen, Bamenda",
    latitude: 5.963,
    longitude: 10.159,
    monthlyRent: 35000,
    cautionFee: 70000,
    status: PropertyStatus.ARCHIVED,
    amenities: ["Prepaid meter", "Borehole water"],
    photos: 2,
  },
  {
    slug: "buea-town-5bed-house",
    owner: "landlord1@urbanrent.cm",
    title: "5-bedroom house in Buea Town",
    description:
      "Spacious family house on the slopes of Buea Town with a clear view over the town. Two sitting rooms, a large kitchen and a gated compound that takes three cars.",
    propertyType: PropertyType.HOUSE,
    bedrooms: 5,
    bathrooms: 3,
    sizeSqm: 260,
    city: "Buea",
    neighborhood: "Buea Town",
    address: "Buea Town, near the palace",
    latitude: 4.155,
    longitude: 9.242,
    monthlyRent: 260000,
    cautionFee: 520000,
    status: PropertyStatus.PUBLISHED,
    amenities: ["Fenced compound", "Parking space", "Garden", "Borehole water", "Kitchen cabinets"],
    photos: 4,
  },
  {
    slug: "molyko-single-room",
    owner: "landlord1@urbanrent.cm",
    title: "Single room with shared kitchen in Molyko",
    description:
      "Budget single room in a compound of four, with a shared kitchen and bathroom. Water and a prepaid meter are already connected. Popular with students.",
    propertyType: PropertyType.OTHER,
    bedrooms: 1,
    bathrooms: 1,
    sizeSqm: 18,
    city: "Buea",
    neighborhood: "Molyko",
    address: "Molyko, behind the campus gate",
    latitude: 4.1541,
    longitude: 9.2933,
    monthlyRent: 20000,
    cautionFee: 40000,
    status: PropertyStatus.PUBLISHED,
    amenities: ["Prepaid meter", "Borehole water"],
    photos: 2,
  },
  {
    slug: "bonaberi-3bed-duplex",
    owner: "landlord2@urbanrent.cm",
    title: "3-bedroom duplex in Bonaberi",
    description:
      "Duplex in a new block with a private entrance and a small yard. Tiled throughout, with kitchen cabinets fitted and space for two cars inside the gate.",
    propertyType: PropertyType.HOUSE,
    bedrooms: 3,
    bathrooms: 2,
    sizeSqm: 150,
    city: "Douala",
    neighborhood: "Bonaberi",
    address: "Bonaberi, near the bridge approach",
    latitude: 4.09,
    longitude: 9.66,
    monthlyRent: 165000,
    cautionFee: 330000,
    status: PropertyStatus.PUBLISHED,
    amenities: ["Tiled floors", "Kitchen cabinets", "Parking space", "Fenced compound", "Prepaid meter"],
    photos: 4,
  },
];

// ------------------------------------------------------------
// Applications (every status represented)
// ------------------------------------------------------------
const APPLICATIONS: ApplicationSeed[] = [
  {
    tenant: "tenant1@urbanrent.cm",
    property: "molyko-2bed-apartment",
    status: ApplicationStatus.SUBMITTED,
    note: "I work at the university and would like to move in at the start of next month.",
    submittedDaysAgo: 2,
  },
  {
    tenant: "tenant1@urbanrent.cm",
    property: "bonapriso-3bed-apartment",
    status: ApplicationStatus.UNDER_REVIEW,
    note: "Relocating to Douala for work. Happy to provide an employer letter.",
    submittedDaysAgo: 6,
  },
  {
    tenant: "tenant2@urbanrent.cm",
    property: "bomaka-3bed-house",
    status: ApplicationStatus.APPROVED,
    note: "Family of four, looking for a long-term let.",
    submittedDaysAgo: 12,
  },
  {
    tenant: "tenant2@urbanrent.cm",
    property: "bonamoussadi-2bed",
    status: ApplicationStatus.REJECTED,
    note: "Interested if the rent is negotiable.",
    submittedDaysAgo: 18,
  },
  {
    tenant: "tenant3@urbanrent.cm",
    property: "great-soppo-studio",
    status: ApplicationStatus.SUBMITTED,
    note: "Single occupant, no pets. Ready to pay the caution fee immediately.",
    submittedDaysAgo: 1,
  },
  {
    tenant: "tenant3@urbanrent.cm",
    property: "nsimeyong-2bed",
    status: ApplicationStatus.WITHDRAWN,
    note: "Found something closer to work, withdrawing for now.",
    submittedDaysAgo: 9,
  },
  {
    tenant: "tenant1@urbanrent.cm",
    property: "buea-town-5bed-house",
    status: ApplicationStatus.SUBMITTED,
    note: "Looking to rent with two colleagues — we can split the caution fee.",
    submittedDaysAgo: 4,
  },
];

// ------------------------------------------------------------
// Viewing requests (every status represented)
// ------------------------------------------------------------
const VIEWINGS: ViewingSeed[] = [
  {
    tenant: "tenant1@urbanrent.cm",
    property: "molyko-2bed-apartment",
    status: ViewingRequestStatus.REQUESTED,
    proposedTimes: [
      daysAhead(3, 10).toISOString(),
      daysAhead(4, 15).toISOString(),
      daysAhead(6, 11).toISOString(),
    ],
    requestedDaysAgo: 1,
  },
  {
    tenant: "tenant1@urbanrent.cm",
    property: "bonapriso-3bed-apartment",
    status: ViewingRequestStatus.CONFIRMED,
    proposedTimes: [daysAhead(5, 9).toISOString(), daysAhead(7, 16).toISOString()],
    confirmedTime: daysAhead(5, 9).toISOString(),
    requestedDaysAgo: 3,
  },
  {
    tenant: "tenant2@urbanrent.cm",
    property: "bomaka-3bed-house",
    status: ViewingRequestStatus.CONFIRMED,
    proposedTimes: [daysAhead(2, 14).toISOString()],
    confirmedTime: daysAhead(2, 14).toISOString(),
    requestedDaysAgo: 5,
  },
  {
    tenant: "tenant2@urbanrent.cm",
    property: "bonamoussadi-2bed",
    status: ViewingRequestStatus.DECLINED,
    proposedTimes: [daysAhead(1, 12).toISOString()],
    requestedDaysAgo: 8,
  },
  {
    tenant: "tenant3@urbanrent.cm",
    property: "great-soppo-studio",
    status: ViewingRequestStatus.COMPLETED,
    proposedTimes: [daysAgo(7, 11).toISOString()],
    confirmedTime: daysAgo(7, 11).toISOString(),
    requestedDaysAgo: 11,
  },
  {
    tenant: "tenant3@urbanrent.cm",
    property: "buea-town-5bed-house",
    status: ViewingRequestStatus.NO_SHOW,
    proposedTimes: [daysAgo(4, 15).toISOString()],
    confirmedTime: daysAgo(4, 15).toISOString(),
    requestedDaysAgo: 9,
  },
];

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
// Rows are collected in maps keyed by the human-readable value from the seed
// arrays, so the listings below can refer to "landlord1@urbanrent.cm" and
// "WiFi" instead of raw UUIDs.
function requireId(map: Map<string, { id: string }>, key: string, what: string): string {
  const row = map.get(key);
  if (!row) {
    throw new Error(`Seed error: ${what} "${key}" was not created before it was needed.`);
  }
  return row.id;
}

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ---------------- Users (upsert) ----------------
  // The role and password are refreshed on every run so the documented demo
  // login always works, even if the email already existed.
  const usersByEmail = new Map<string, { id: string }>();
  for (const user of USERS) {
    const row = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        role: user.role,
        passwordHash,
        verificationState: user.verified
          ? VerificationState.VERIFIED
          : VerificationState.UNVERIFIED,
      },
      create: {
        email: user.email,
        passwordHash,
        role: user.role,
        verificationState: user.verified
          ? VerificationState.VERIFIED
          : VerificationState.UNVERIFIED,
      },
    });
    usersByEmail.set(user.email, row);
  }
  console.log(`users        ${usersByEmail.size} ready (password: ${PASSWORD})`);

  // ---------------- Amenity catalog (upsert) ----------------
  const amenitiesByName = new Map<string, { id: string }>();
  for (const name of AMENITIES) {
    const row = await prisma.amenity.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    amenitiesByName.set(name, row);
  }
  console.log(`amenities    ${amenitiesByName.size} ready`);

  // ---------------- Listings (only when the table is empty) ----------------
  const existingProperties = await prisma.property.count();
  if (existingProperties > 0) {
    console.log(
      `properties   ${existingProperties} already present — skipping the demo listings.`
    );
    console.log("Seed complete (users and amenities were refreshed, nothing was deleted).");
    return;
  }

  const propertyBySlug = new Map<string, { id: string }>();

  for (const [index, seed] of PROPERTIES.entries()) {
    const ownerId = requireId(usersByEmail, seed.owner, "user");
    const amenityIds = seed.amenities.map((name) =>
      requireId(amenitiesByName, name, "amenity")
    );

    const property = await prisma.property.create({
      data: {
        ownerId,
        title: seed.title,
        description: seed.description,
        propertyType: seed.propertyType,
        bedrooms: seed.bedrooms,
        bathrooms: seed.bathrooms,
        sizeSqm: seed.sizeSqm,
        city: seed.city,
        neighborhood: seed.neighborhood,
        address: seed.address,
        latitude: seed.latitude,
        longitude: seed.longitude,
        monthlyRent: seed.monthlyRent,
        cautionFee: seed.cautionFee,
        status: seed.status,
        // Staggered so the marketplace's "newest first" ordering is real.
        createdAt: daysAgo(index + 1),
        images: {
          create: Array.from({ length: seed.photos }, (_, photo) => ({
            // Placeholder photos — swap for real uploads at any time.
            url: `https://picsum.photos/seed/${seed.slug}-${photo + 1}/1200/800`,
            publicId: `seed/${seed.slug}-${photo + 1}`,
          })),
        },
        propertyAmenities: {
          create: amenityIds.map((amenityId) => ({ amenityId })),
        },
      },
    });

    propertyBySlug.set(seed.slug, property);
  }
  console.log(`properties   ${propertyBySlug.size} created`);

  // ---------------- Applications ----------------
  for (const seed of APPLICATIONS) {
    await prisma.application.create({
      data: {
        tenantId: requireId(usersByEmail, seed.tenant, "user"),
        propertyId: requireId(propertyBySlug, seed.property, "property"),
        status: seed.status,
        note: seed.note,
        createdAt: daysAgo(seed.submittedDaysAgo),
      },
    });
  }
  console.log(`applications ${APPLICATIONS.length} created`);

  // ---------------- Viewing requests ----------------
  for (const seed of VIEWINGS) {
    await prisma.viewingRequest.create({
      data: {
        tenantId: requireId(usersByEmail, seed.tenant, "user"),
        propertyId: requireId(propertyBySlug, seed.property, "property"),
        status: seed.status,
        proposedTimes: seed.proposedTimes,
        confirmedTime: seed.confirmedTime ? new Date(seed.confirmedTime) : null,
        createdAt: daysAgo(seed.requestedDaysAgo),
      },
    });
  }
  console.log(`viewings     ${VIEWINGS.length} created`);

  console.log("\nSeed complete. Log in with any demo account above.");
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
