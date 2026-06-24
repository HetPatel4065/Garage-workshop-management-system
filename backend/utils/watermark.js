import sharp from "sharp";
import fs from "fs";
import path from "path";

export const addWatermark = async (filePath, text) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`[Watermark] File does not exist: ${filePath}`);
      return;
    }

    const imageBuffer = await fs.promises.readFile(filePath);
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // Calculate dynamic font size, stroke size, and positioning based on image dimensions
    const fontSize = Math.max(14, Math.floor(width * 0.035));
    const strokeWidth = Math.max(1.5, Math.floor(fontSize * 0.15));
    const padding = Math.max(10, Math.floor(width * 0.02));

    const x = width - padding;
    const y = height - padding;

    // Clean text to avoid breaking XML (escaping special HTML/XML chars)
    const escapedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

    const svgText = `
      <svg width="${width}" height="${height}">
        <style>
          .watermark {
            font-family: sans-serif;
            font-size: ${fontSize}px;
            font-weight: bold;
            fill: #ffffff;
            stroke: #000000;
            stroke-width: ${strokeWidth}px;
            stroke-linejoin: round;
            paint-order: stroke fill;
            opacity: 0.85;
          }
        </style>
        <text x="${x}" y="${y}" class="watermark" text-anchor="end">${escapedText}</text>
      </svg>
    `;

    const watermarkedBuffer = await image
      .composite([
        {
          input: Buffer.from(svgText),
          top: 0,
          left: 0,
        },
      ])
      .toBuffer();

    await fs.promises.writeFile(filePath, watermarkedBuffer);
    console.log(
      `[Watermark] Successfully watermarked ${filePath} with "${text}"`,
    );
  } catch (error) {
    console.error(`[Watermark] Failed to add watermark to ${filePath}:`, error);
  }
};
