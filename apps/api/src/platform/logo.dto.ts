import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from "@nestjs/common";
import { object, versionOf } from "../staff/staff.dto";
export type LogoDto = { logoDataUrl: string | null; version: number };
@Injectable()
export class LogoValidationPipe implements PipeTransform<unknown, LogoDto> {
  transform(input: unknown): LogoDto {
    const body = object(input, ["logoDataUrl", "version"]);
    const version = versionOf(body.version);
    if (body.logoDataUrl === null) return { logoDataUrl: null, version };
    const value = body.logoDataUrl;
    const invalid = () => {
      throw new BadRequestException(
        "El logo debe ser una imagen PNG de hasta 256 × 256 px y 65 KB. Vuelve a seleccionar la imagen.",
      );
    };
    if (
      typeof value !== "string" ||
      value.length > 90000 ||
      !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
    )
      return invalid();
    const base64 = value.slice("data:image/png;base64,".length);
    const bytes = Buffer.from(base64, "base64");
    if (
      bytes.toString("base64") !== base64 ||
      bytes.length < 45 ||
      bytes.length > 65536 ||
      bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" ||
      bytes.readUInt32BE(8) !== 13 ||
      bytes.toString("ascii", 12, 16) !== "IHDR" ||
      bytes.toString("ascii", bytes.length - 8, bytes.length - 4) !== "IEND"
    )
      return invalid();
    const width = bytes.readUInt32BE(16),
      height = bytes.readUInt32BE(20);
    if (!width || !height || width > 256 || height > 256) return invalid();
    return { logoDataUrl: value, version };
  }
}
