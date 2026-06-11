import User from "../models/User.js";

const initializeAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME;

    if (!adminEmail || !adminPassword) {
      console.warn("⚠️ Admin credentials missing in .env");
      return;
    }

    let admin = await User.findOne({ role: "admin" });

    if (admin) {
      // Update existing admin to match .env
      admin.name = adminName || "Admin";
      admin.email = adminEmail;
      admin.password = adminPassword; 
      await admin.save();
      console.log(`👤 Admin Synchronized: ${adminEmail}`);
    } else {
      // Create new admin if none exists
      await User.create({
        name: adminName || "Admin",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
      });
      console.log(`👤 Default Admin Created: ${adminEmail}`);
    }
  } catch (adminError) {
    console.error("❌ Error syncing default admin:", adminError.message);
  }
};

export default initializeAdmin;
