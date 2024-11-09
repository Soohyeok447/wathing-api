import * as sharp from 'sharp';

export async function resizeImage(
  buffer: Buffer,
  width: number,
): Promise<Buffer> {
  return sharp(buffer).resize({ width }).toBuffer();
}
