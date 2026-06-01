import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const notifications = await Notification.find({ ownerId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.effectiveOwnerId;
    
    await Notification.findOneAndUpdate({ _id: id, ownerId }, { read: true });
    
    res.status(200).json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    await Notification.updateMany({ ownerId }, { read: true });
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.effectiveOwnerId;
    
    const deleted = await Notification.findOneAndDelete({ _id: id, ownerId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    
    res.status(200).json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearAllNotifications = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    await Notification.deleteMany({ ownerId });
    res.status(200).json({ success: true, message: "All notifications cleared successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
