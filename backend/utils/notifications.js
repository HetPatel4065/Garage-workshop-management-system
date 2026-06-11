import nodemailer from "nodemailer";

const getTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    console.error("[NOTIFY] SMTP credentials missing in .env!");
    return null;
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
};

export const sendEmail = async ({
  to,
  subject,
  html,
  attachments = [],
  smtpConfig = null,
  fromName = "Garage Admin",
}) => {
  try {
    let transporter;

    if (smtpConfig && smtpConfig.user && smtpConfig.pass) {
      transporter = nodemailer.createTransport({
        host: smtpConfig.host || "smtp.gmail.com",
        port: smtpConfig.port || 587,
        secure: smtpConfig.secure || false,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass,
        },
      });
    } else {
      transporter = getTransporter();
    }

    if (!transporter) {
      console.log(
        `[EMAIL SKIPPED] SMTP not configured. Would send: "${subject}" → ${to}`,
      );
      return;
    }

    const fromEmail = smtpConfig?.user || process.env.SMTP_USER;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `[EMAIL SENT] ID: ${info.messageId} | Subject: "${subject}" → ${to}`,
    );
  } catch (err) {
    console.error("[EMAIL ERROR] Failed to send email:", err.message);
  }
};

export const buildDailyReportEmail = ({ garageName, date, stats }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Report</title>
  <style>
    @media screen and (max-width: 480px) {
      .responsive-td {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .mobile-padding {
        padding: 16px !important;
      }
      .mobile-margin-bottom {
        margin-bottom: 12px !important;
        height: 12px !important;
        display: block !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:24px 16px;">
    <tr>
      <td align="center">
        <!--[if mso]>
        <table border="0" cellpadding="0" cellspacing="0" width="580"><tr><td>
        <![endif]-->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin:0 auto;">
          <tr>
            <td bgcolor="#2563eb" align="center" style="padding:32px 24px;border-radius:12px 12px 0 0;">
              <h1 style="margin:0 0 8px;font-size:24px;color:#ffffff;font-weight:700;">${garageName || "Your Garage"}</h1>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);">Live Project Report &mdash; ${date}</p>
            </td>
          </tr>
          <tr>
            <td class="mobile-padding" style="padding:24px 32px 0;font-size:15px;color:#475569;">
              <p style="margin:0 0 24px;">Here&rsquo;s a live summary of your full project:</p>
              
              <!-- Stats Grid: 2x2 on desktop, stacked on mobile -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                <tr>
                  <td class="responsive-td" width="48%" valign="top">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                      <tr>
                        <td align="center" style="padding:20px;">
                          <div style="font-size:26px;font-weight:800;color:#1e40af;">${stats.newServices ?? 0}</div>
                          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-top:6px;">TOTAL SERVICES</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td class="responsive-td mobile-margin-bottom" width="4%"></td>
                  <td class="responsive-td" width="48%" valign="top">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                      <tr>
                        <td align="center" style="padding:20px;">
                          <div style="font-size:26px;font-weight:800;color:#1e40af;">${stats.completedServices ?? 0}</div>
                          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-top:6px;">TOTAL COMPLETED</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td class="responsive-td" width="48%" valign="top">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                      <tr>
                        <td align="center" style="padding:20px;">
                          <div style="font-size:26px;font-weight:800;color:#1e40af;">₹${stats.billing ?? 0}</div>
                          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-top:6px;">TOTAL BILLED</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td class="responsive-td mobile-margin-bottom" width="4%"></td>
                  <td class="responsive-td" width="48%" valign="top">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:8px;">
                      <tr>
                        <td align="center" style="padding:20px;">
                          <div style="font-size:26px;font-weight:800;color:#166534;">₹${stats.revenue ?? 0}</div>
                          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#166534;margin-top:6px;">CASH COLLECTED</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Other Minor Stats -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;margin-bottom:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:10px 0;color:#64748b;">Total Customers</td>
                  <td style="padding:10px 0;text-align:right;font-weight:700;color:#0f172a;">${stats.totalCustomers ?? 0}</td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:10px 0;color:#64748b;">Registered Vehicles</td>
                  <td style="padding:10px 0;text-align:right;font-weight:700;color:#0f172a;">${stats.totalVehicles ?? 0}</td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:10px 0;color:#64748b;">Job Cards Created</td>
                  <td style="padding:10px 0;text-align:right;font-weight:700;color:#0f172a;">${stats.totalJobCards ?? 0}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#64748b;">Staff Members</td>
                  <td style="padding:10px 0;text-align:right;font-weight:700;color:#0f172a;">${stats.totalStaff ?? 0}</td>
                </tr>
              </table>
              
              ${
                stats.lowStockItems?.length > 0
                  ? `
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;font-size:14px;color:#92400e;">
                    &#9888;&#65039; <strong>Low Stock:</strong> ${stats.lowStockItems.join(", ")}
                  </td>
                </tr>
              </table>`
                  : ""
              }
              
            </td>
          </tr>
          <tr>
            <td bgcolor="#f8fafc" align="center" style="padding:16px 24px;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;font-size:12px;color:#94a3b8;">
              Garage Manager &bull; Automated Report &bull; Do not reply to this email.
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;

/** Build a service reminder SMS message */
export const buildServiceReminderSMS = ({
  customerName,
  vehicleNumber,
  garageName,
}) =>
  `Hi ${customerName}, your vehicle ${vehicleNumber} is due for service at ${garageName}. Please book your appointment. Thank you!`;

/** Build a service reminder email */
export const buildServiceReminderEmail = ({
  customerName,
  vehicleNumber,
  dueDate,
  garageName,
  contactNumber,
}) => `
<!DOCTYPE html>
<html>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #2563eb; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px;">Service Reminder</h1>
    <p style="margin: 10px 0 0; opacity: 0.9;">Time for your vehicle's routine checkup</p>
  </div>
  <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; background: #fff;">
    <p>Dear <strong>${customerName}</strong>,</p>
    <p>This is a friendly reminder from <strong>${garageName}</strong> that your vehicle <strong>${vehicleNumber}</strong> is due for its next periodic service on <strong>${dueDate}</strong>.</p>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2563eb;">
      <p style="margin: 0; color: #64748b; font-size: 14px;">Scheduled Date:</p>
      <p style="margin: 5px 0 0; font-size: 18px; font-weight: bold; color: #1e40af;">${dueDate}</p>
    </div>

    <p>Regular maintenance ensures your vehicle remains safe, reliable, and performs at its best. Please contact us to schedule your service appointment.</p>

    <p style="margin-bottom: 0;">Need help? Call us at:</p>
    <p style="margin-top: 5px; font-size: 18px; font-weight: bold; color: #2563eb;">${contactNumber}</p>
    
    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="font-size: 12px; color: #94a3b8; text-align: center;">You are receiving this because your vehicle is registered with ${garageName}.</p>
  </div>
</body>
</html>
`;

/** Build a low-stock SMS/email alert */
export const buildLowStockSMS = ({ partName, currentStock, garageName }) =>
  `[${garageName}] Low stock alert: "${partName}" has only ${currentStock} unit(s) left. Please restock soon.`;
