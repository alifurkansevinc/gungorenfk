import { NextRequest } from "next/server";
import { getNeighbourhoodsByDistrict } from "@/lib/forms-data";

export async function GET(request: NextRequest) {
  const districtId = request.nextUrl.searchParams.get("district_id");
  if (!districtId) return Response.json([]);
  const id = parseInt(districtId, 10);
  if (Number.isNaN(id)) return Response.json([]);
  const neighbourhoods = await getNeighbourhoodsByDistrict(id);
  return Response.json(neighbourhoods);
}
