import { findAmenitiesByProperty, findAmenityById, createAmenity, deleteAmenity, linkAmenityToProperty} from "../repositories/amenityRepository.js";

export async function getAmenitybyProperty(propertyid: string){
    const amenity = await findAmenitiesByProperty(propertyid)
    if(!amenity) throw new Error("Amenity not found")
        return amenity
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
