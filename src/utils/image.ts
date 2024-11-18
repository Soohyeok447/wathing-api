import * as sharp from 'sharp';

export async function resizeImage(
  buffer: Buffer,
  width: number,
): Promise<Buffer> {
  return sharp(buffer).rotate().resize({ width }).toBuffer();
}
