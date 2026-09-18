import { prisma } from "./db";
import { assertRegionExists } from "./regions";
import {
  dateRangeFilter,
  toRecoveryDTO,
  type RecoveryDTO,
} from "./serializers";

/** List a region's recovery indicators within an optional date window. */
export async function getRecovery(params: {
  regionId: string;
  from?: Date;
  to?: Date;
}): Promise<RecoveryDTO[]> {
  await assertRegionExists(params.regionId);

  const rows = await prisma.recoveryIndicator.findMany({
    where: {
      regionId: params.regionId,
      date: dateRangeFilter(params.from, params.to),
    },
    orderBy: { date: "asc" },
  });

  return rows.map(toRecoveryDTO);
}
