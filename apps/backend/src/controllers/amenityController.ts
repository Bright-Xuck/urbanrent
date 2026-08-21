import type { Request, Response } from "express";
import {
  getAmenitybyProperty,
  PostAmenityNormal, DeleteAmenityRoute, AmenityToProperty
} from "../services/amenityService.js";


export async function getAmenities(req: Request, res: Response) {
  const { propid } = req.params;
  if (typeof propid !== "string") {
    res.status(401).json({ message: "Invalid property id" });
    return;
  }
  try {
    const amenities = await getAmenitybyProperty(propid);
    res.status(201).send(amenities);
  } catch (error) {
    res.status(401).json({mesage:"Failed to get amenity for this property"})
  }
}

export async function postAmenity(req: Request, res: Response) {
  const {propid} = req.params
  const { name, pictureurl } = req.body;
  if (typeof name !== "string" || typeof propid !=="string") {
    res.status(400).json({ message: "Invalid amenity name and picture" });
    return;
  }
  try {
    const amenities = await PostAmenityNormal(name, pictureurl);
    const link = await AmenityToProperty(amenities.id, propid)
    res.status(201).json({ message: "Amenity created succesfully", amenities, link });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Invalid server repsonse" });
  }
}

export async function deletebyId(req: Request, res: Response) {
  const { id } = req.params;
  if (typeof id !== "string") {
    res.status(401).json({ message: "Invalid amenity id" });
    return
  }
  try {
    const deletedRes = await DeleteAmenityRoute(id);
    res.status(201).json({ message: "successfully deleted amenity", deletedRes });
  } catch (error) {
    res.status(501).json({message:"Invalid server Response"})
  }
}
