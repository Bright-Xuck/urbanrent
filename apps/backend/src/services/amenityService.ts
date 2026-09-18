import { findAmenitiesByProperty, createAmenity, deleteAmenity, linkAmenityToProperty } from "../repositories/amenityRepository.js";
import { findPropertyById } from "../repositories/propertyRepository.js";

// ============================================================
// AMENITY SERVICE
// ============================================================
// Business rules for amenities. The ownership guard lives here rather than
// in the controller so it reads the database through the repository layer,
// exactly like updatePropertyForOwner / deletePropertyForOwner do.
// ============================================================

export async function getAmenitybyProperty(propertyid: string){
    const amenity = await findAmenitiesByProperty(propertyid)
    if(!amenity) throw new Error("Amenity not found")
        return amenity
}

// Throws unless `userId` owns `propertyId` (ADMIN bypasses ownership).
// The error messages are matched by the controller to pick a status code.
export async function assertCanManageAmenities(
    propertyId: string,
    userId: string,
    role: string
) {
    const property = await findPropertyById(propertyId);
    if (!property) throw new Error("Property not found");
    if (role !== "ADMIN" && property.ownerId !== userId) {
        throw new Error("You do not have permission to change this property's amenities");
    }
    return property;
}

export async function PostAmenityNormal(name:string, picture:string){
    const amenity = await createAmenity({name, picture})
    return amenity
}

export async function DeleteAmenityRoute(id:string){
    const amenity = await deleteAmenity(id)
    return amenity
}

export async function AmenityToProperty(id:string, propid:string) {
    const result = await linkAmenityToProperty(id, propid)
    return result
}
