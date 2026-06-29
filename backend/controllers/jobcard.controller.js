import JobCard from "../models/JobCard.js";
import Vehicle from "../models/Vehicle.js";
import Customer from "../models/Customer.js";
import { createNotification } from "../utils/notificationHelper.js";
import { logActivity } from "../utils/activityLogger.js";
import { emitToOwner } from "../utils/socket.js";

export const createJobCard = async (req, res) => {
  try {
    const { vehicleId, serviceInstructions, advisorId, mechanicId } =
      req.body;
    const ownerId = req.user.effectiveOwnerId;
    if (!ownerId) return res.status(403).json({ error: "Unauthorized" });

    // Ensure vehicle belongs to garage
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      garageId: ownerId,
    }).populate("customerId");
    if (!vehicle) {
      return res
        .status(404)
        .json({ error: "Vehicle not found in this garage" });
    }

    const newJobCard = new JobCard({
      garageId: ownerId,
      customerId: vehicle.customerId._id,
      customerName: vehicle.customerId.name,
      vehicleId: vehicle._id,
      licensePlate: vehicle.licensePlate,
      serviceInstructions,
      advisorId,
      mechanicId,
    });

    const savedJobCard = await newJobCard.save();

    // 🚀 Activate Customer if status was 'Pending' (First Entry)
    if (vehicle.customerId && vehicle.customerId.status === "Pending") {
      await Customer.findByIdAndUpdate(vehicle.customerId._id, {
        status: "Active",
      });
      console.log(
        `Customer ${vehicle.customerId.name} activated via Job Card entry.`,
      );
    }

    // Populate refs to return
    await savedJobCard.populate("customerId", "name");
    await savedJobCard.populate(
      "vehicleId",
      "make model licensePlate displayName",
    );
    await savedJobCard.populate("advisorId", "name");
    await savedJobCard.populate("mechanicId", "name");

    // 🔔 Notify Owner/Staff
    await createNotification({
      ownerId,
      title: "New Job Card Created",
      message: `Job Card ${savedJobCard.jobCardId} has been created for ${vehicle.licensePlate} (${vehicle.customerId.name}).`,
      type: "info",
      link: "/job-cards",
    });
    await logActivity(
      req,
      "create",
      "JobCard",
      `Created Job Card ${savedJobCard.jobCardId} for vehicle ${vehicle.licensePlate}`,
      savedJobCard._id,
    );

    emitToOwner(ownerId, "jobcard:created", savedJobCard);

    res.status(201).json(savedJobCard);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Duplicate Job Card ID generated" });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getJobCards = async (req, res) => {
  try {
    const { role, _id: userId, effectiveOwnerId: ownerId } = req.user;

    const query = { garageId: ownerId };

    if (role === "mechanic") {
      query.mechanicId = userId;
    } else if (role === "advisor") {
      query.advisorId = userId;
    }

    // Query-based filtering
    const { status, staff, date, startDate, endDate } = req.query;

    if (status && status !== "All") {
      query.status = status;
    }

    if (staff && staff !== "All") {
      if (staff === "unassigned") {
        query.$or = [{ mechanicId: null }, { mechanicId: { $exists: false } }];
      } else {
        query.$or = [{ mechanicId: staff }, { advisorId: staff }];
      }
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const jobCards = await JobCard.find(query)
      .populate("customerId", "name phone")
      .populate("vehicleId", "make model licensePlate displayName")
      .populate("advisorId", "name")
      .populate("mechanicId", "name")
      .sort({ createdAt: 1 });
    res.json(jobCards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateJobCard = async (req, res) => {
  try {
    const { role, _id: userId, effectiveOwnerId: ownerId } = req.user;
    const { id } = req.params;

    // 1. Fetch current job card to check assignment
    const currentJobCard = await JobCard.findOne({
      _id: id,
      garageId: ownerId,
    });
    if (!currentJobCard)
      return res.status(404).json({ error: "Job card not found" });

    // --- PERMISSION CHECKS ---
    if (role === "mechanic") {
      if (currentJobCard.mechanicId?.toString() !== userId.toString()) {
        return res.status(403).json({
          error: "Unauthorized: You can only edit Job Cards assigned to you.",
        });
      }
    } else if (role === "advisor") {
      if (currentJobCard.advisorId?.toString() !== userId.toString()) {
        return res.status(403).json({
          error: "Unauthorized: You can only edit Job Cards assigned to you.",
        });
      }
    }

    // 3. Proceed with update
    const jobCard = await JobCard.findOneAndUpdate(
      { _id: id, garageId: ownerId },
      req.body,
      { new: true, runValidators: true },
    )
      .populate("customerId", "name phone")
      .populate("vehicleId", "make model licensePlate displayName")
      .populate("advisorId", "name")
      .populate("mechanicId", "name");

    // Cascade Assignment Updates to child Services
    const { default: Service } = await import("../models/Service.js");
    await Service.updateMany(
      { jobId: jobCard._id },
      {
        $set: { advisorId: jobCard.advisorId, mechanicId: jobCard.mechanicId },
      },
    );

    // 🔔 Notify if status changed
    if (req.body.status && req.body.status !== currentJobCard.status) {
      await createNotification({
        ownerId,
        title: "Job Card Status Updated",
        message: `Job Card ${jobCard.jobCardId} (${jobCard.licensePlate}) status changed to: ${jobCard.status.replace("-", " ")}.`,
        type: "info",
        link: "/job-cards",
      });
    }
    await logActivity(
      req,
      "update",
      "JobCard",
      `Updated Job Card ${jobCard.jobCardId} for vehicle ${jobCard.licensePlate}`,
      jobCard._id,
    );

    emitToOwner(ownerId, "jobcard:updated", jobCard);

    res.json(jobCard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteJobCard = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const { role } = req.user;

    const jobCard = await JobCard.findOne({
      _id: req.params.id,
      garageId: ownerId,
    });
    if (!jobCard) return res.status(404).json({ error: "Job card not found" });

    // --- PERMISSION CHECKS ---
    if (role === "mechanic") {
      return res
        .status(403)
        .json({ error: "Mechanics cannot delete Job Cards." });
    }

    if (role === "advisor") {
      // Advisor can delete Job Card ONLY IF status is pending-inspection or inspection-complete
      if (
        !["pending-inspection", "inspection-complete"].includes(jobCard.status)
      ) {
        return res.status(403).json({
          error: `Advisors cannot delete Job Cards with status: ${jobCard.status}`,
        });
      }

      const { default: Service } = await import("../models/Service.js");
      const relatedServices = await Service.find({ jobId: jobCard._id });

      const workStarted = relatedServices.some(
        (s) =>
          ["in-progress", "submitted-for-review", "completed"].includes(
            s.status,
          ) ||
          (s.workLogs && s.workLogs.length > 0),
      );

      if (workStarted) {
        return res.status(403).json({
          error:
            "Cannot delete Job Card because mechanic work has already started.",
        });
      }
    }

    // All roles now have full control to delete Job Cards in their garage

    await JobCard.deleteOne({ _id: jobCard._id });

    // Also delete associated services if allowed
    const { default: Service } = await import("../models/Service.js");
    await Service.deleteMany({ jobId: jobCard._id });

    await logActivity(
      req,
      "delete",
      "JobCard",
      `Deleted Job Card ${jobCard.jobCardId} for vehicle ${jobCard.licensePlate}`,
      jobCard._id,
    );

    emitToOwner(ownerId, "jobcard:deleted", { _id: jobCard._id });

    res.json({ message: "Job card deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
