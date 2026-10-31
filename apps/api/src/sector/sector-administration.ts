import type { Prisma } from "../generated/prisma/client";
import { isVertical } from "./sector.contract";
export class SectorSelectionError extends Error {}
export function sectorTargetId(value: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new SectorSelectionError(
      "Indica --establishment con un UUID explícito y válido.",
    );
  return value;
}
export function initialVertical(value: unknown) {
  if (!isVertical(value))
    throw new SectorSelectionError(
      "Indica una vertical explícita: BEAUTY, DENTAL, FITNESS o AUTOMOTIVE.",
    );
  if (value !== "BEAUTY")
    throw new SectorSelectionError(
      `${value} está planificada. Solo BEAUTY admite configuración operativa local en M1.6.1.`,
    );
  return value;
}
export async function assignInitialVertical(
  tx: Prisma.TransactionClient,
  input: {
    establishment: string;
    vertical: unknown;
    reason: string;
    version: number;
  },
) {
  const vertical = initialVertical(input.vertical);
  sectorTargetId(input.establishment);
  if (
    !Number.isSafeInteger(input.version) ||
    input.version < 0 ||
    input.version >= 2147483647 ||
    input.reason.trim().length < 20 ||
    input.reason.trim().length > 500
  )
    throw new SectorSelectionError(
      "Requiere UUID explícito, versión actual y evidencia de clasificación de 20 a 500 caracteres.",
    );
  const result = await tx.establishment.updateMany({
    where: {
      id: input.establishment,
      vertical: null,
      version: input.version,
      status: "ACTIVE",
    },
    data: {
      vertical,
      verticalConfiguredAt: new Date(),
      verticalConfigurationReason: input.reason.trim(),
      version: { increment: 1 },
    },
  });
  if (result.count !== 1)
    throw new SectorSelectionError(
      "No se clasificó: establecimiento inexistente, inactivo, ya clasificado o versión distinta. No se reclasifican cuentas.",
    );
  return vertical;
}
