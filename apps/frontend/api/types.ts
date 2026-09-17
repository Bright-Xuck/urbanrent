// ============================================================
// SHARED DOMAIN TYPES
// ============================================================
// These mirror what the backend actually sends over the wire, which in
// turn mirrors apps/backend/prisma/schema.prisma.
//
// IMPORTANT: JSON has no Date type, so every date column the backend
// returns (createdAt, updatedAt, confirmedTime, ...) arrives here as an
// ISO STRING, not a Date object. Convert at the edge (e.g. with
// `new Date(property.createdAt)`) only when you actually need to.
//
// The enums below are plain string unions rather than Prisma's generated
// enums because the frontend never imports the backend's generated client.
// ============================================================

// ------------------------------------------------------------
// Enums (mirror generated/prisma/enums.ts)
// ------------------------------------------------------------
export type Role = "TENANT" | "LANDLORD" | "ADMIN";

export type PropertyStatus = "DRAFT" | "PUBLISHED" | "UNPUBLISHED" | "ARCHIVED";

export type PropertyType =
  | "APARTMENT"
  | "STUDIO"
  | "HOUSE"
  | "VILLA"
  | "COMMERCIAL"
  | "OTHER";

export type ApplicationStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN";

export type ViewingRequestStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "DECLINED"
  | "COMPLETED"
  | "NO_SHOW";

// ------------------------------------------------------------
// Property
// ------------------------------------------------------------
// The backend sends a raw Prisma row, so optional columns come back as
// `null` (not `undefined`) — that's why these are `| null`.
export type Property = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  propertyType: PropertyType;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqm: number | null;
  city: string;
  neighborhood: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  monthlyRent: number;
  cautionFee: number | null;
  status: PropertyStatus;
  createdAt: string;
  updatedAt: string;
};

// The trimmed owner the backend selects when it includes a property on
// an application / viewing request (`select: { id, email }`).
export type PropertyOwnerRef = {
  id: string;
  email: string;
};

// A property as it appears nested inside an application or viewing
// request. `owner` is only present on the single-item (findById) reads.
export type NestedProperty = Property & {
  owner?: PropertyOwnerRef;
};

// ------------------------------------------------------------
// Property images + amenities
// ------------------------------------------------------------
export type PropertyImage = {
  id: string;
  propertyId: string;
  url: string;
  publicId: string;
  createdAt: string;
};

export type Amenity = {
  id: string;
  name: string;
  picture: string | null;
};

// The join row returned when an amenity is linked to a property.
export type PropertyAmenityLink = {
  id: string;
  propertyId: string;
  amenityId: string;
  createdAt: string;
};

// ------------------------------------------------------------
// Application
// ------------------------------------------------------------
export type Application = {
  id: string;
  tenantId: string;
  propertyId: string;
  status: ApplicationStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  // Present on list + findById reads (the repository `include`s it).
  property?: NestedProperty;
};

// ------------------------------------------------------------
// Viewing request
// ------------------------------------------------------------
export type ViewingRequest = {
  id: string;
  propertyId: string;
  tenantId: string;
  status: ViewingRequestStatus;
  // Stored as a JSON array of ISO strings; Prisma types it as JsonValue,
  // so the backend can technically return null.
  proposedTimes: string[] | null;
  confirmedTime: string | null;
  createdAt: string;
  updatedAt: string;
  // Present on list + findById reads.
  property?: NestedProperty;
};

// ------------------------------------------------------------
// Pagination envelope
// ------------------------------------------------------------
// What GET /api/properties and GET /api/properties/mine return.
export type PaginatedProperties = {
  properties: Property[];
  total: number;
  offset: number;
  limit: number;
  totalPages: number;
};