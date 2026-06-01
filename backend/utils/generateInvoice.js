import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateAndSaveInvoicePDF = (invoice, settings = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const invoicesDir = path.join(__dirname, "../uploads/invoices");
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }

      const filename = `${new Date().getFullYear()}-${invoice.invoiceNumber || invoice._id}.pdf`;
      const filepath = path.join(invoicesDir, filename);
      const relativePath = `invoices/${filename}`;

      // Create a document with consistent margins and size
      const doc = new PDFDocument({
        margin: 40,
        size: "A4",
        info: {
          Title: `${new Date().getFullYear()}-${invoice.invoiceNumber || invoice._id}`,
          Author: settings.garageName || "Garage Management System",
        },
      });

      const writeStream = fs.createWriteStream(filepath);
      doc.pipe(writeStream);

      // ─── Design Tokens (Shared with all renders) ─────────────────────────
      const BLUE = "#2563eb"; // Modern Blue
      const DARK = "#0f172a"; // Slate-900
      const GRAY = "#64748b"; // Slate-500
      const LIGHT_GRAY = "#f8fafc"; // Slate-50
      const BORDER_COLOR = "#e2e8f0"; // Slate-200
      const PAGE_W = doc.page.width;

      const formatCurrency = (val) =>
        `Rs. ${Number(val || 0).toLocaleString("en-IN")}`;
      const formatDate = (date) =>
        date
          ? new Date(date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-";

      // ─── 1. Header (Premium Modern Layout) ───────────────────────────────

      // Top Blue Bar
      doc.rect(0, 0, PAGE_W, 80).fill(BLUE);

      // Logo (Left side inside blue bar)
      const logoPathToUse = settings.logo || settings.invoiceLogo;
      if (logoPathToUse) {
        try {
          // Ensure we handle absolute paths or paths starting with /
          const cleanPath = logoPathToUse.startsWith("/")
            ? logoPathToUse.substring(1)
            : logoPathToUse;
          const logoPath = path.isAbsolute(cleanPath)
            ? cleanPath
            : path.join(__dirname, "..", cleanPath);

          if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 40, 15, { height: 50 });
          }
        } catch (e) {
          console.error("PDF Logo Error:", e);
        }
      }

      const hasLogo = !!logoPathToUse;
      doc
        .fillColor("#ffffff")
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("SERVICE INVOICE", hasLogo ? 130 : 40, 25, {
          align: "right",
          width: PAGE_W - (hasLogo ? 170 : 80),
        });

      doc
        .fontSize(9)
        .font("Helvetica")
        .text(
          `INVOICE: #${invoice.invoiceNumber || "N/A"}`,
          hasLogo ? 130 : 40,
          52,
          { align: "right", width: PAGE_W - (hasLogo ? 170 : 80) },
        );

      // ─── 2. Business & Customer Info ────────────────────────────────────
      const infoY = 110;

      // Business Info (Left)
      doc
        .fillColor(DARK)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(settings.garageName || "Garage Name", 40, infoY);

      doc
        .fillColor(GRAY)
        .fontSize(9)
        .font("Helvetica")
        .text(settings.businessAddress || "Garage Address", 40, infoY + 20, {
          width: 220,
        })
        .text(
          `Contact: ${settings.mobileNumber || settings.contactNumber || "N/A"}`,
          40,
          infoY + 45,
        );

      if (settings.gstNumber || settings.gst) {
        doc.text(
          `GSTIN: ${settings.gstNumber || settings.gst}`,
          40,
          infoY + 58,
        );
      }

      // Customer Info (Right)
      const rightX = PAGE_W - 220;
      doc
        .fillColor(GRAY)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("BILL TO", rightX, infoY);

      doc
        .fillColor(DARK)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(
          invoice.customerId?.name || "Valued Customer",
          rightX,
          infoY + 15,
        );

      doc
        .fillColor(GRAY)
        .fontSize(9)
        .font("Helvetica")
        .text(
          `${invoice.customerId?.phone || invoice.customerId?.mobileNumber || "N/A"}`,
          rightX,
          infoY + 30,
        )
        .text(invoice.customerId?.email || "", rightX, infoY + 42, {
          width: 180,
        });

      // ─── 3. Details Bar (Vehicle & Dates) ───────────────────────────────
      const barY = 200;
      const vehicle =
        invoice.serviceId?.vehicleId || invoice.serviceId?.vehicle;

      doc.rect(40, barY, PAGE_W - 80, 40).fill(LIGHT_GRAY);
      doc.rect(40, barY, PAGE_W - 80, 1).fill(BORDER_COLOR);
      doc.rect(40, barY + 39, PAGE_W - 80, 1).fill(BORDER_COLOR);

      // Vehicle Details
      doc
        .fillColor(GRAY)
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("VEHICLE DETAILS", 60, barY + 10);
      doc
        .fillColor(DARK)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(
          `${vehicle?.make || ""} ${vehicle?.model || ""} (${vehicle?.licensePlate || "N/A"})`.toUpperCase(),
          60,
          barY + 22,
        );

      // Dates
      doc
        .fillColor(GRAY)
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("INVOICE DATE", PAGE_W - 220, barY + 10);
      doc
        .fillColor(DARK)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(formatDate(invoice.createdAt), PAGE_W - 220, barY + 22);

      // ─── 4. Items Table ─────────────────────────────────────────────────
      const tableY = 270;
      let rowY = tableY;

      // Table Header
      doc.rect(40, rowY, PAGE_W - 80, 30).fill(DARK);
      doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold");
      doc.text("DESCRIPTION", 60, rowY + 10);
      doc.text("QTY", 350, rowY + 10, { width: 50, align: "center" });
      doc.text("RATE", 410, rowY + 10, { width: 65, align: "right" });
      doc.text("TOTAL", 480, rowY + 10, { width: 75, align: "right" });

      rowY += 35;

      const capitalize = (str) => {
        if (!str) return "";
        return str
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      };

      const drawRow = (desc, qty, rate, total) => {
        // Check for page break
        if (rowY > doc.page.height - 150) {
          doc.addPage();
          rowY = 40;
        }

        const capitalizedDesc = capitalize(desc || "Item");

        doc.fillColor(DARK).fontSize(9).font("Helvetica");
        doc.text(capitalizedDesc, 60, rowY, { width: 280, lineGap: 2 });
        doc.text(String(qty || "-"), 350, rowY, { width: 50, align: "center" });
        doc.text(formatCurrency(rate), 410, rowY, {
          width: 65,
          align: "right",
        });
        doc
          .font("Helvetica-Bold")
          .text(formatCurrency(total), 480, rowY, {
            width: 75,
            align: "right",
          });

        const textHeight = doc.heightOfString(capitalizedDesc, { width: 280 });
        rowY += Math.max(textHeight + 10, 25);

        // Row separator
        doc
          .moveTo(40, rowY - 5)
          .lineTo(PAGE_W - 40, rowY - 5)
          .strokeColor(BORDER_COLOR)
          .lineWidth(0.5)
          .stroke();
      };

      // Combine all items (Services, Labor, Parts)
      const items = [];
      if (invoice.services)
        invoice.services.forEach((s) =>
          items.push({
            name: s.name,
            qty: "-",
            rate: s.priceSnapshot || s.total,
            total: s.total,
          }),
        );
      if (invoice.labor && invoice.labor.priceSnapshot > 0)
        items.push({
          name: invoice.labor.typeOfWork || "Labour Charges",
          qty: "-",
          rate: invoice.labor.priceSnapshot,
          total: invoice.labor.priceSnapshot,
        });
      if (invoice.parts)
        invoice.parts.forEach((p) =>
          items.push({
            name: p.name,
            qty: p.quantity,
            rate: p.priceSnapshot,
            total: p.total || p.priceSnapshot * p.quantity,
          }),
        );

      items.forEach((item) =>
        drawRow(item.name, item.qty, item.rate, item.total),
      );

      // ─── 5. Summary Section ─────────────────────────────────────────────
      rowY += 20;
      const summaryX = PAGE_W - 240;

      const drawSummaryRow = (label, value, isBold = false, color = DARK) => {
        doc
          .fillColor(GRAY)
          .fontSize(9)
          .font("Helvetica-Bold")
          .text(label.toUpperCase(), summaryX, rowY, {
            width: 120,
            align: "right",
          });

        doc
          .fillColor(color)
          .fontSize(10)
          .font(isBold ? "Helvetica-Bold" : "Helvetica")
          .text(formatCurrency(value), summaryX + 130, rowY, {
            width: 70,
            align: "right",
          });

        rowY += 20;
      };

      drawSummaryRow("SUBTOTAL", invoice.subTotal || 0);
      if (invoice.discountAmount > 0)
        drawSummaryRow(
          `DISCOUNT (${invoice.discountPercent}%)`,
          -invoice.discountAmount,
          false,
          "#16a34a",
        );
      drawSummaryRow("TAX (GST 18%)", invoice.gst || 0);

      // Grand Total Bar
      doc.rect(summaryX, rowY - 5, 200, 35).fill(BLUE);
      doc
        .fillColor("#ffffff")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("GRAND TOTAL", summaryX + 15, rowY + 10);
      doc
        .fontSize(14)
        .text(
          formatCurrency(invoice.total || invoice.totalAmount),
          summaryX + 100,
          rowY + 8,
          { width: 90, align: "right" },
        );

      // ─── 6. Footer ──────────────────────────────────────────────────────
      const footerY = doc.page.height - 80;

      if (settings.upiId) {
        try {
          const upiString = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.garageName || "Garage")}&am=${invoice.total || invoice.totalAmount}&cu=INR`;
          const qrBuffer = await QRCode.toBuffer(upiString, {
            errorCorrectionLevel: "H",
            margin: 1,
            color: { dark: "#000000", light: "#ffffff" },
          });
          // Draw QR Code on the left side
          doc.image(qrBuffer, 40, rowY - 5, { width: 120 });
          doc
            .fillColor(DARK)
            .fontSize(8)
            .font("Helvetica-Bold")
            .text("We are also accepting UPI Payments.", 40, rowY + 125, {
              width: 120,
              align: "center",
            });
        } catch (qrErr) {
          console.error("Failed to generate QR code:", qrErr);
        }
      }

      doc
        .moveTo(40, footerY - 10)
        .lineTo(PAGE_W - 40, footerY - 10)
        .strokeColor(BORDER_COLOR)
        .lineWidth(0.5)
        .stroke();

      doc
        .fillColor(GRAY)
        .fontSize(9)
        .font("Helvetica-Oblique")
        .text(
          `Thank you for choosing ${settings.garageName || "us"}!`,
          40,
          footerY,
          { align: "center", width: PAGE_W - 80 },
        )
        .text(
          "This is a computer-generated invoice and does not require a signature.",
          40,
          footerY + 15,
          { align: "center", width: PAGE_W - 80 },
        );

      doc.end();

      writeStream.on("finish", () => resolve(relativePath));
      writeStream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

export { generateAndSaveInvoicePDF };
