import { NextRequest } from "next/server";
import { getDistrictsByCity } from "@/lib/forms-data";

export async function GET(request: NextRequest) {
  const cityId = request.nextUrl.searchParams.get("city_id");
  if (!cityId) return Response.json([]);
  const id = parseInt(cityId, 10);
  if (Number.isNaN(id)) return Response.json([]);
  const districts = await getDistrictsByCity(id);
  return Response.json(districts);
}
