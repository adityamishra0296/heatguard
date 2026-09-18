import { prisma } from "./db";
import { assertRegionExists } from "./regions";
import { dateRangeFilter, toReadingDTO, type ReadingDTO } from "./serializers";

/** List a region's temperature readings within an optional date window. */
export async function getReadings(params: {
  regionId: string;
  from?: Date;
  to?: Date;
}): Promise<ReadingDTO[]> {
  await assertRegionExists(params.regionId);

  const rows = await prisma.temperatureReading.findMany({
    where: {
      regionId: params.regionId,
      timestamp: dateRangeFilter(params.from, params.to),
    },
    orderBy: { timestamp: "asc" },
  });

  return rows.map(toReadingDTO);
}
