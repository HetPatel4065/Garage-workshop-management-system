import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

console.log(" Socket.io server successfully initialized and attached.");
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join", (id) => {
      if (id) {
        socket.join(id.toString());
        console.log(`Socket ${socket.id} joined room: ${id}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const emitToOwner = (ownerId, event, data) => {
  if (io && ownerId) {
    io.to(ownerId.toString()).emit(event, data);
  }
};

export const emitToCustomer = (customerEmail, event, data) => {
  if (io && customerEmail) {
    io.to(customerEmail.toString()).emit(event, data);
  }
};
