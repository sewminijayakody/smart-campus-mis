// src/server.js
import "dotenv/config";
import express, { json } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import authMiddleware from "./middleware/authMiddleware.js";
import db from "./config/db.js";
import upload from "./multerConfig.js";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import nodemailer from "nodemailer";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const formatToMySQLDateTime = (isoString) => {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    console.error("Invalid ISO string for timestamp:", isoString);
    return new Date().toISOString().slice(0, 19).replace("T", " ");
  }
  return date.toISOString().slice(0, 19).replace("T", " ");
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

app.use(json());
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);

app.options("/api/students/:id", cors(), (req, res) => {
  console.log("Received OPTIONS request for student ID:", req.params.id);
  res.sendStatus(200);
});

app.options("/api/lecturers/:id", cors(), (req, res) => {
  console.log("Received OPTIONS request for lecturer ID:", req.params.id);
  res.sendStatus(200);
});

app.options("/api/requests/:id/status", cors(), (req, res) => {
  console.log("Received OPTIONS request for request ID:", req.params.id);
  res.sendStatus(200);
});

app.options("/api/requests/user", cors(), (req, res) => {
  console.log("Received OPTIONS request for user requests");
  res.sendStatus(200);
});

app.options("/api/notifications", cors(), (req, res) => {
  console.log("Received OPTIONS request for notifications");
  res.sendStatus(200);
});

app.options("/api/announcements", cors(), (req, res) => {
  console.log("Received OPTIONS request for announcements");
  res.sendStatus(200);
});

app.options("/api/lecturer/profile", cors(), (req, res) => {
  console.log("Received OPTIONS request for lecturer profile");
  res.sendStatus(200);
});

app.options("/api/admin/profile", cors(), (req, res) => {
  console.log("Received OPTIONS request for admin profile");
  res.sendStatus(200);
});

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created uploads directory at ${uploadDir}`);
} else {
  console.log(`Uploads directory exists at ${uploadDir}`);
}

(async () => {
  try {
    await db.query("SELECT 1");
    console.log("Connected to MySQL database ✅");
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
})();

app.get("/", (req, res) => {
  res.send("Smart Campus Backend is Running 🚀");
});

app.use("/api/auth", authRoutes);

app.get("/api/inquiries", authMiddleware, async (req, res) => {
  try {
    let [result] = [];
    if (req.user.role === "admin") {
      [result] = await db.query("SELECT * FROM inquiries");
    } else {
      [result] = await db.query("SELECT * FROM inquiries WHERE user_id = ?", [
        req.user.id,
      ]);
    }
    res.json(result);
  } catch (err) {
    console.error("Error fetching inquiries:", err);
    res.status(500).json({ error: "Error fetching inquiries" });
  }
});

app.post("/api/inquiries", authMiddleware, async (req, res) => {
  const { subject, message, status, submittedDate } = req.body;

  if (!subject || !message || !status || !submittedDate) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    await db.query(
      "INSERT INTO inquiries (subject, message, status, submittedDate, user_id) VALUES (?, ?, ?, ?, ?)",
      [subject, message, status, submittedDate, req.user.id]
    );
    const [result] = await db.query(
      "SELECT * FROM inquiries WHERE id = LAST_INSERT_ID()"
    );
    res.status(201).json(result[0]);
  } catch (err) {
    console.error("Error adding inquiry:", err);
    res.status(500).json({ error: "Error adding inquiry" });
  }
});

app.post("/api/inquiries/:id/respond", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { response } = req.body;

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  const replyDate = new Date().toISOString().split("T")[0];
  try {
    const [result] = await db.query(
      "UPDATE inquiries SET adminReply = ?, status = ?, replyDate = ? WHERE id = ?",
      [response, "Replied", replyDate, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Inquiry not found" });
    }
    const [updatedInquiry] = await db.query(
      "SELECT * FROM inquiries WHERE id = ?",
      [id]
    );
    res.json(updatedInquiry[0]);
  } catch (err) {
    console.error("Error updating inquiry:", err);
    res.status(500).json({ error: "Error updating inquiry" });
  }
});

app.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  const fileUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;
  const { title, description, color } = req.body;

  try {
    await db.query(
      "INSERT INTO admin_uploads (title, description, file_name, url, color) VALUES (?, ?, ?, ?, ?)",
      [title, description, req.file.originalname, fileUrl, color]
    );
    res
      .status(201)
      .json({ message: "File uploaded successfully!", url: fileUrl });
  } catch (err) {
    console.error("Error saving file to database:", err);
    res.status(500).json({ error: "Error saving file to database" });
  }
});

app.get("/uploads", async (req, res) => {
  try {
    const [result] = await db.query("SELECT * FROM admin_uploads");
    res.json(result);
  } catch (err) {
    console.error("Error fetching uploads:", err);
    res.status(500).json({ error: "Error fetching uploads" });
  }
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/admin/dashboard", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  try {
    const [admin] = await db.query(
      "SELECT name, email, role FROM users WHERE id = ?",
      [req.user.id]
    );
    if (admin.length === 0)
      return res.status(404).json({ message: "Admin not found" });
    res.json({ message: "Welcome to Admin Dashboard", admin: admin[0] });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/student/dashboard", authMiddleware, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Access denied. Students only." });
  }
  try {
    const [student] = await db.query(
      "SELECT id, name, course, startDate, endDate, email, phone, address, imageUrl, role FROM users WHERE id = ?",
      [req.user.id]
    );
    if (student.length === 0)
      return res.status(404).json({ message: "Student not found" });
    console.log("Student dashboard data:", student[0]);
    res.json({ message: "Welcome to Student Dashboard", student: student[0] });
  } catch (error) {
    console.error("Error fetching student dashboard data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/lecturer/dashboard", authMiddleware, async (req, res) => {
  if (req.user.role !== "lecturer") {
    return res.status(403).json({ message: "Access denied. Lecturers only." });
  }
  try {
    const [lecturer] = await db.query(
      "SELECT id, name, role, email, course, startDate, endDate, phone, address, imageUrl, module FROM users WHERE id = ?",
      [req.user.id]
    );

    if (lecturer.length === 0)
      return res.status(404).json({ message: "Lecturer not found" });
    console.log("Lecturer dashboard data:", lecturer[0]);
    res.json({
      message: "Welcome to Lecturer Dashboard",
      lecturer: lecturer[0],
    });
  } catch (error) {
    console.error("Error fetching lecturer dashboard data:", error);
    res.status(500).json({ message: "Server error" });
  }
});
app.put(
  "/api/lecturer/profile",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    if (req.user.role !== "lecturer") {
      return res
        .status(403)
        .json({ message: "Access denied. Lecturers only." });
    }

    const { name, email, phone, address, course } = req.body;
    let imageUrl = req.body.imageUrl;

    if (!name || !email || !phone || !address || !course) {
      return res.status(400).json({ error: "All fields are required." });
    }

    try {
      if (req.file) {
        imageUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;
      }

      const [result] = await db.query(
        "UPDATE users SET name = ?, email = ?, phone = ?, address = ?, course = ?, imageUrl = ? WHERE id = ? AND role = ?",
        [name, email, phone, address, course, imageUrl, req.user.id, "lecturer"]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Lecturer not found" });
      }

      const [updatedLecturer] = await db.query(
        "SELECT id, name, course, startDate, endDate, email, phone, address, imageUrl, role FROM users WHERE id = ?",
        [req.user.id]
      );

      res.json({
        message: "Profile updated successfully",
        lecturer: updatedLecturer[0],
      });
    } catch (err) {
      console.error("Error updating lecturer profile:", err);
      res.status(500).json({ error: "Error updating lecturer profile" });
    }
  }
);

app.put(
  "/api/admin/profile",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const { name, email, phone, address } = req.body;
    let imageUrl = req.body.imageUrl || req.user.imageUrl;

    if (!name || !email || !phone || !address) {
      return res.status(400).json({
        error: "All fields (name, email, phone, address) are required.",
      });
    }

    try {
      if (req.file) {
        imageUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;
      }

      const [result] = await db.query(
        "UPDATE users SET name = ?, email = ?, phone = ?, address = ?, imageUrl = ? WHERE id = ? AND role = ?",
        [name, email, phone, address, imageUrl, req.user.id, "admin"]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Admin not found" });
      }

      const [updatedAdmin] = await db.query(
        "SELECT id, name, email, phone, address, imageUrl, role FROM users WHERE id = ?",
        [req.user.id]
      );

      res.json({
        message: "Profile updated successfully",
        admin: updatedAdmin[0],
      });
    } catch (err) {
      console.error("Error updating admin profile:", err);
      res.status(500).json({ error: "Error updating admin profile" });
    }
  }
);

app.get("/api/user", authMiddleware, async (req, res) => {
  try {
    const [user] = await db.query(
      "SELECT id, name, role, email, course, startDate, endDate, phone, address, imageUrl, module FROM users WHERE id = ?",
      [req.user.id]
    );
    if (user.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.json({ user: user[0] });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/user/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  try {
    const [user] = await db.query("SELECT id, name FROM users WHERE id = ?", [
      req.params.id,
    ]);
    if (user.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.json({ name: user[0].name });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/users", authMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, name, role, imageUrl, created_at FROM users WHERE id != ?",
      [req.user.id]
    );
    res.json({
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.imageUrl || "default-avatar.png",
        created_at: user.created_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get(
  "/api/messages/:recipientIdOrRoomId",
  authMiddleware,
  async (req, res) => {
    const { recipientIdOrRoomId } = req.params;
    const senderId = req.user.id;

    try {
      let messages;
      if (isNaN(recipientIdOrRoomId)) {
        const [group] = await db.query(
          "SELECT id FROM chat_groups WHERE room_id = ?",
          [recipientIdOrRoomId]
        );
        if (group.length === 0)
          return res.status(404).json({ message: "Group not found" });
        const groupId = group[0].id;
        [messages] = await db.query(
          "SELECT cm.*, u.name AS sender_name FROM chat_messages cm JOIN users u ON cm.sender_id = u.id WHERE group_id = ? ORDER BY timestamp ASC",
          [groupId]
        );
      } else {
        [messages] = await db.query(
          "SELECT cm.*, u.name AS sender_name FROM chat_messages cm JOIN users u ON cm.sender_id = u.id WHERE (cm.sender_id = ? AND cm.recipient_id = ?) OR (cm.sender_id = ? AND cm.recipient_id = ?) AND group_id IS NULL ORDER BY timestamp ASC",
          [senderId, recipientIdOrRoomId, recipientIdOrRoomId, senderId]
        );
      }
      res.json({ messages });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.post("/api/groups", authMiddleware, async (req, res) => {
  const { name, memberIds } = req.body;
  if (
    !name ||
    !memberIds ||
    !Array.isArray(memberIds) ||
    memberIds.length < 1
  ) {
    return res
      .status(400)
      .json({ error: "Name and at least one member ID are required." });
  }

  const creatorId = req.user.id;
  const roomId = `group_${Date.now()}_${creatorId}`;

  try {
    await db.query("START TRANSACTION");
    const [groupResult] = await db.query(
      "INSERT INTO chat_groups (room_id, name, created_by) VALUES (?, ?, ?)",
      [roomId, name, creatorId]
    );
    const groupId = groupResult.insertId;
    const members = [[groupId, creatorId, new Date()]].concat(
      memberIds.map((userId) => [groupId, userId, new Date()])
    );
    await db.query(
      "INSERT INTO chat_group_members (group_id, user_id, joined_at) VALUES ?",
      [members]
    );
    await db.query("COMMIT");
    res
      .status(201)
      .json({ groupId, roomId, name, message: "Group created successfully!" });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error creating group:", error);
    res.status(500).json({ error: "Error creating group" });
  }
});

app.get("/api/groups", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const [groups] = await db.query(
      `SELECT cg.id, cg.room_id, cg.name, cg.created_by, cg.created_at
       FROM chat_groups cg
       JOIN chat_group_members cgm ON cg.id = cgm.group_id
       WHERE cgm.user_id = ?`,
      [userId]
    );
    res.json({ groups });
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post(
  "/api/upload-file",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const fileUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;
    res.status(201).json({ fileUrl });
  }
);

app.post("/api/notifications", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  const { message, recipientId, type = "Administrator" } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    const senderId = req.user.id;
    const [result] = await db.query(
      "INSERT INTO notifications (sender_id, recipient_id, message, type, sent_at) VALUES (?, ?, ?, ?, ?)",
      [
        senderId,
        recipientId || null,
        message,
        type,
        formatToMySQLDateTime(new Date()),
      ]
    );
    const [notification] = await db.query(
      "SELECT * FROM notifications WHERE id = LAST_INSERT_ID()"
    );

    let recipients = [];
    if (recipientId) {
      const [user] = await db.query(
        "SELECT email, phone FROM users WHERE id = ?",
        [recipientId]
      );
      if (user.length === 0) throw new Error("Recipient not found");
      recipients = [user[0]];
    } else {
      const [users] = await db.query(
        "SELECT email, phone FROM users WHERE role IN (?, ?)",
        ["student", "lecturer"]
      );
      recipients = users;
    }

    const notificationPromises = recipients.map(async (recipient) => {
      const emailPromise = recipient.email
        ? transporter
            .sendMail({
              from: process.env.EMAIL_USER,
              to: recipient.email,
              subject: `${type} Notification`,
              text: message,
            })
            .catch((err) => {
              console.error(`Error sending email to ${recipient.email}:`, err);
              return { emailSent: false, emailError: err.message };
            })
        : Promise.resolve({
            emailSent: false,
            emailError: "No email provided",
          });

      const smsPromise = recipient.phone
        ? twilioClient.messages
            .create({
              body: message,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: recipient.phone,
            })
            .catch((err) => {
              console.error(`Error sending SMS to ${recipient.phone}:`, err);
              return { smsSent: false, smsError: err.message };
            })
        : Promise.resolve({ smsSent: false, smsError: "No phone provided" });

      const [emailResult, smsResult] = await Promise.all([
        emailPromise,
        smsPromise,
      ]);
      return { emailResult, smsResult };
    });

    const notificationResults = await Promise.all(notificationPromises);
    console.log("Notification results:", notificationResults);

    const notificationData = {
      id: notification[0].id,
      senderId,
      recipientId: notification[0].recipientId,
      message: notification[0].message,
      type: notification[0].type,
      sent_at: notification[0].sent_at,
      sender_name: req.user.name,
    };
    if (recipientId) {
      io.to(recipientId.toString()).emit(
        "receiveNotification",
        notificationData
      );
    } else {
      io.emit("receiveNotification", notificationData);
    }

    res
      .status(201)
      .json({ ...notification[0], deliveryResults: notificationResults });
  } catch (err) {
    console.error("Error sending notification:", err);
    res
      .status(500)
      .json({ error: "Error sending notification", details: err.message });
  }
});

app.post("/api/announcements", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    const senderId = req.user.id;
    const [result] = await db.query(
      "INSERT INTO announcements (sender_id, message, sent_at) VALUES (?, ?, ?)",
      [senderId, message, formatToMySQLDateTime(new Date())]
    );
    const [announcement] = await db.query(
      "SELECT * FROM announcements WHERE id = LAST_INSERT_ID()"
    );

    const announcementData = {
      id: announcement[0].id,
      senderId,
      message: announcement[0].message,
      sent_at: announcement[0].sent_at,
      sender_name: req.user.name,
    };
    io.emit("receiveAnnouncement", announcementData);

    res.status(201).json(announcement[0]);
  } catch (err) {
    console.error("Error sending announcement:", err);
    res.status(500).json({ error: "Error sending announcement" });
  }
});

app.get("/api/notifications", authMiddleware, async (req, res) => {
  try {
    let [result] = [];
    if (req.user.role === "admin") {
      [result] = await db.query(
        "SELECT n.*, u.name AS sender_name FROM notifications n JOIN users u ON n.sender_id = u.id"
      );
    } else {
      [result] = await db.query(
        "SELECT n.*, u.name AS sender_name FROM notifications n JOIN users u ON n.sender_id = u.id WHERE n.recipient_id = ? OR n.recipient_id IS NULL",
        [req.user.id]
      );
    }
    res.json(result);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Error fetching notifications" });
  }
});

app.get("/api/announcements", authMiddleware, async (req, res) => {
  try {
    const [result] = await db.query(
      "SELECT a.*, u.name AS sender_name FROM announcements a JOIN users u ON a.sender_id = u.id"
    );
    res.json(result);
  } catch (err) {
    console.error("Error fetching announcements:", err);
    res.status(500).json({ error: "Error fetching announcements" });
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  console.log("Handshake token received:", token);
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    socket.user = decoded;
    console.log(
      "Socket authenticated for user:",
      decoded.id,
      "with role:",
      decoded.role
    );
    next();
  } catch (error) {
    console.log("Socket authentication error:", error.message);
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(
    "A user connected with socket ID:",
    socket.id,
    "User ID:",
    socket.user.id
  );

  socket.on("join", (data) => {
    const roomId = socket.user.id.toString();
    socket.join(roomId);
    console.log(
      `User ${socket.user.id} (Socket ID: ${socket.id}) joined room: ${roomId}`
    );
    io.emit("userJoined", {
      userId: socket.user.id,
      role: socket.user.role,
      name: data.name,
    });
    console.log(
      `${data.name} (${socket.user.role}) joined with userId: ${socket.user.id}`
    );
  });

  socket.on("joinRoom", (data) => {
    const { room } = data;
    socket.join(room);
    console.log(
      `Socket ${socket.id} (User ID: ${socket.user.id}) joined room: ${room}`
    );
  });

  socket.on("sendMessage", async (messageData) => {
    const { senderId, recipientId, message, fileUrl, timestamp, groupId } =
      messageData;
    console.log(`Received sendMessage from socket ${socket.id}:`, messageData);

    if (!senderId || !message || !timestamp || (!recipientId && !groupId)) {
      console.error("Invalid message data:", messageData);
      return;
    }

    try {
      const formattedTimestamp = formatToMySQLDateTime(timestamp);
      console.log("Formatted timestamp for MySQL:", formattedTimestamp);
      const [result] = await db.query(
        "INSERT INTO chat_messages (sender_id, recipient_id, message, file_url, timestamp, group_id) VALUES (?, ?, ?, ?, ?, ?)",
        [
          senderId,
          recipientId || null,
          message,
          fileUrl || null,
          formattedTimestamp,
          groupId || null,
        ]
      );
      console.log("Database insert result:", result);

      const [sender] = await db.query("SELECT name FROM users WHERE id = ?", [
        senderId,
      ]);
      const senderName = sender[0]?.name || "Unknown";

      let room;
      if (groupId) {
        const [group] = await db.query(
          "SELECT room_id FROM chat_groups WHERE id = ?",
          [groupId]
        );
        room = group[0].room_id;
      } else {
        room = [senderId, recipientId].sort().join("-");
      }

      if (!socket.rooms.has(room)) {
        socket.join(room);
        console.log(
          `Sender ${senderId} (Socket ID: ${socket.id}) joined room: ${room}`
        );
      }

      if (groupId) {
        io.to(room).emit("joinRoom", { room });
        console.log(`Requested group members to join room ${room}`);
      } else {
        io.to(recipientId.toString()).emit("joinRoom", { room });
        console.log(`Requested recipient ${recipientId} to join room ${room}`);
      }

      const messageId = result.insertId;
      const broadcastData = { ...messageData, id: messageId, senderName };
      console.log(`Broadcasting to room ${room} with message ID: ${messageId}`);
      io.to(room).emit("receiveMessage", broadcastData);
      console.log(`Message broadcast to room ${room} with ID: ${messageId}`);

      console.log(
        `Socket ${socket.id} rooms after emit:`,
        Array.from(socket.rooms)
      );
    } catch (error) {
      console.error(
        "Error saving or sending message:",
        error.message,
        error.stack
      );
    }
  });

  socket.on("disconnect", () => {
    console.log(
      "User disconnected with socket ID:",
      socket.id,
      "User ID:",
      socket.user.id
    );
  });
});

app.post("/api/events", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  const { title, location, time, date } = req.body;

  if (!title || !location || !time || !date) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO events (title, location, time, date, created_by) VALUES (?, ?, ?, ?, ?)",
      [title, location, time, date, req.user.id]
    );
    const [event] = await db.query(
      "SELECT * FROM events WHERE id = LAST_INSERT_ID()"
    );
    res.status(201).json(event[0]);
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ error: "Error creating event" });
  }
});

app.get("/api/events", authMiddleware, async (req, res) => {
  try {
    const [events] = await db.query(
      "SELECT e.*, COUNT(r.user_id) as registeredUsers FROM events e LEFT JOIN event_registrations r ON e.id = r.event_id GROUP BY e.id"
    );
    console.log("Events fetched from database:", events);
    if (events.length === 0) {
      console.log("No events found in the database");
    }
    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Error fetching events" });
  }
});

app.post("/api/events/:id/register", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [existing] = await db.query(
      "SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ?",
      [id, userId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Already registered" });
    }

    await db.query(
      "INSERT INTO event_registrations (event_id, user_id, registered_at) VALUES (?, ?, ?)",
      [id, userId, formatToMySQLDateTime(new Date())]
    );
    res.json({ message: "Registered successfully" });
  } catch (err) {
    console.error("Error registering for event:", err);
    res.status(500).json({ error: "Error registering for event" });
  }
});

app.get("/api/events/registrations", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [registrations] = await db.query(
      "SELECT event_id FROM event_registrations WHERE user_id = ?",
      [userId]
    );
    const eventIds = registrations.map((reg) => reg.event_id);
    res.json(eventIds);
  } catch (err) {
    console.error("Error fetching user registrations:", err);
    res.status(500).json({ error: "Error fetching user registrations" });
  }
});

app.get("/api/students", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  try {
    const [students] = await db.query(
      "SELECT id, name, email, phone, address, startDate, endDate, course FROM users WHERE role = ?",
      ["student"]
    );
    const formattedStudents = students.map((student) => ({
      ...student,
      studentId: student.id,
    }));
    res.json(formattedStudents);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Error fetching students" });
  }
});

app.get("/api/students/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  const { id } = req.params;

  try {
    const [student] = await db.query(
      "SELECT id, name, email, phone, address, startDate, endDate, course FROM users WHERE id = ? AND role = ?",
      [id, "student"]
    );
    if (student.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }
    const formattedStudent = {
      ...student[0],
      studentId: student[0].id,
    };
    res.json(formattedStudent);
  } catch (err) {
    console.error("Error fetching student:", err);
    res.status(500).json({ error: "Error fetching student" });
  }
});

app.put("/api/students/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  const { id } = req.params;
  const { name, email, phone, address, startDate, endDate, course } = req.body;

  if (
    !name ||
    !email ||
    !phone ||
    !address ||
    !startDate ||
    !endDate ||
    !course
  ) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const [result] = await db.query(
      "UPDATE users SET name = ?, email = ?, phone = ?, address = ?, startDate = ?, endDate = ?, course = ? WHERE id = ? AND role = ?",
      [name, email, phone, address, startDate, endDate, course, id, "student"]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ message: "Student updated successfully" });
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ error: "Error updating student" });
  }
});

app.delete("/api/students/:id", authMiddleware, async (req, res) => {
  console.log("Received DELETE request for student ID:", req.params.id);
  console.log("User from authMiddleware:", req.user);

  if (req.user.role !== "admin") {
    console.log("Access denied: User is not an admin");
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  const { id } = req.params;

  try {
    console.log("Executing DELETE query for student ID:", id);
    const [result] = await db.query(
      "DELETE FROM users WHERE id = ? AND role = ?",
      [id, "student"]
    );
    console.log("DELETE query result:", result);

    if (result.affectedRows === 0) {
      console.log("Student not found for ID:", id);
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ error: "Error deleting student" });
  }
});

app.get("/api/lecturers", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  try {
    const [lecturers] = await db.query(
      "SELECT id, name, role, email, course, startDate, endDate, phone, address, imageUrl, module FROM users WHERE role = ?",
      ["lecturer"]
    );
    const formattedLecturers = lecturers.map((lecturer) => ({
      ...lecturer,
      module: lecturer.module || "N/A",
    }));
    res.json(formattedLecturers);
  } catch (err) {
    console.error("Error fetching lecturers:", err);
    res.status(500).json({ error: "Error fetching lecturers" });
  }
});

app.get("/api/lecturers/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  const { id } = req.params;

  try {
    const [lecturer] = await db.query(
      "SELECT id, name, email, phone, address, course FROM users WHERE id = ? AND role = ?",
      [id, "lecturer"]
    );
    if (lecturer.length === 0) {
      return res.status(404).json({ message: "Lecturer not found" });
    }
    const formattedLecturer = {
      ...lecturer[0],
      module: lecturer[0].module || "N/A",
    };
    res.json(formattedLecturer);
  } catch (err) {
    console.error("Error fetching lecturer:", err);
    res.status(500).json({ error: "Error fetching lecturer" });
  }
});

app.put("/api/lecturers/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  const { id } = req.params;
  const { name, email, phone, address, course, module } = req.body;

  if (!name || !email || !phone || !address || !course || !module) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const [result] = await db.query(
      "UPDATE users SET name = ?, email = ?, phone = ?, address = ?, course = ?, module = ? WHERE id = ? AND role = ?",
      [name, email, phone, address, course, module, id, "lecturer"]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Lecturer not found" });
    }
    res.json({ message: "Lecturer updated successfully" });
  } catch (err) {
    console.error("Error updating lecturer:", err);
    res.status(500).json({ error: "Error updating lecturer" });
  }
});

app.delete("/api/lecturers/:id", authMiddleware, async (req, res) => {
  console.log("Received DELETE request for lecturer ID:", req.params.id);
  console.log("User from authMiddleware:", req.user);

  if (req.user.role !== "admin") {
    console.log("Access denied: User is not an admin");
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  const { id } = req.params;

  try {
    console.log("Executing DELETE query for lecturer ID:", id);
    const [result] = await db.query(
      "DELETE FROM users WHERE id = ? AND role = ?",
      [id, "lecturer"]
    );
    console.log("DELETE query result:", result);

    if (result.affectedRows === 0) {
      console.log("Lecturer not found for ID:", id);
      return res.status(404).json({ message: "Lecturer not found" });
    }
    res.json({ message: "Lecturer deleted successfully" });
  } catch (err) {
    console.error("Error deleting lecturer:", err);
    res.status(500).json({ error: "Error deleting lecturer" });
  }
});

app.post("/api/requests", authMiddleware, async (req, res) => {
  const { resourceType, details } = req.body;

  if (!resourceType || !details) {
    return res
      .status(400)
      .json({ error: "Resource type and details are required." });
  }

  try {
    await db.query(
      "INSERT INTO resource_requests (user_id, resourceType, details, status, submittedDate) VALUES (?, ?, ?, ?, ?)",
      [
        req.user.id,
        resourceType,
        details,
        "Pending",
        formatToMySQLDateTime(new Date()),
      ]
    );
    const [result] = await db.query(
      "SELECT * FROM resource_requests WHERE id = LAST_INSERT_ID()"
    );
    res.status(201).json(result[0]);
  } catch (err) {
    console.error("Error submitting request:", err);
    res.status(500).json({ error: "Error submitting request" });
  }
});

app.get("/api/requests", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  try {
    const [requests] = await db.query("SELECT * FROM resource_requests");
    res.json(requests);
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ error: "Error fetching requests" });
  }
});

app.get("/api/requests/user", authMiddleware, async (req, res) => {
  if (req.user.role !== "student" && req.user.role !== "lecturer") {
    return res
      .status(403)
      .json({ message: "Access denied. Students and lecturers only." });
  }

  try {
    const [requests] = await db.query(
      "SELECT * FROM resource_requests WHERE user_id = ? ORDER BY submittedDate DESC",
      [req.user.id]
    );
    res.json(requests);
  } catch (err) {
    console.error("Error fetching user requests:", err);
    res.status(500).json({ error: "Error fetching user requests" });
  }
});

app.post("/api/requests/:id/status", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  const { id } = req.params;
  const { status, adminResponse } = req.body;

  if (!status || !["Approved", "Rejected"].includes(status)) {
    return res
      .status(400)
      .json({ error: "Valid status (Approved or Rejected) is required." });
  }

  try {
    const [result] = await db.query(
      "UPDATE resource_requests SET status = ?, adminResponse = ? WHERE id = ?",
      [status, adminResponse || null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Request not found" });
    }
    const [updatedRequest] = await db.query(
      "SELECT * FROM resource_requests WHERE id = ?",
      [id]
    );
    res.json(updatedRequest[0]);
  } catch (err) {
    console.error("Error updating request status:", err);
    res.status(500).json({ error: "Error updating request status" });
  }
});

app.post("/api/schedule", authMiddleware, async (req, res) => {
  if (req.user.role !== "lecturer") {
    return res.status(403).json({ message: "Access denied. Lecturers only." });
  }
  const { module, course, date, time, location } = req.body;

  if (!module || !course || !date || !time || !location) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO schedules (module, course, date, time, location, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        module,
        course,
        date,
        time,
        location,
        req.user.id,
        formatToMySQLDateTime(new Date()),
      ]
    );
    const [schedule] = await db.query(
      "SELECT * FROM schedules WHERE id = LAST_INSERT_ID()"
    );
    res.status(201).json(schedule[0]);
  } catch (err) {
    console.error("Error creating schedule:", err);
    res.status(500).json({ error: "Error creating schedule" });
  }
});

app.get("/api/schedule", authMiddleware, async (req, res) => {
  try {
    const { module, course } = req.query;
    if (!module && !course) {
      return res
        .status(400)
        .json({ error: "Module or course parameter is required." });
    }

    let query;
    if (req.user.role === "lecturer" && module) {
      query =
        "SELECT s.*, COUNT(r.user_id) as registeredUsers FROM schedules s LEFT JOIN schedule_registrations r ON s.id = r.schedule_id WHERE s.module = ? GROUP BY s.id";
    } else if (req.user.role === "student" && course) {
      query =
        "SELECT s.*, COUNT(r.user_id) as registeredUsers FROM schedules s LEFT JOIN schedule_registrations r ON s.id = r.schedule_id WHERE s.course = ? GROUP BY s.id";
    } else {
      return res.status(403).json({ message: "Access denied." });
    }

    const [schedules] = await db.query(query, [module || course]);
    res.json(schedules);
  } catch (err) {
    console.error("Error fetching schedules:", err);
    res.status(500).json({ error: "Error fetching schedules" });
  }
});

app.post("/api/schedule/register", authMiddleware, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Access denied. Students only." });
  }
  const { scheduleId } = req.body;

  if (!scheduleId) {
    return res.status(400).json({ error: "Schedule ID is required." });
  }

  try {
    const [existing] = await db.query(
      "SELECT * FROM schedule_registrations WHERE schedule_id = ? AND user_id = ?",
      [scheduleId, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Already registered" });
    }

    await db.query(
      "INSERT INTO schedule_registrations (schedule_id, user_id, registered_at) VALUES (?, ?, ?)",
      [scheduleId, req.user.id, formatToMySQLDateTime(new Date())]
    );
    res.json({ message: "Registered successfully", scheduleId });
  } catch (err) {
    console.error("Error registering for schedule:", err);
    res.status(500).json({ error: "Error registering for schedule" });
  }
});

app.get("/api/schedule/registrations", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [registrations] = await db.query(
      "SELECT schedule_id FROM schedule_registrations WHERE user_id = ?",
      [userId]
    );
    const scheduleIds = registrations.map((reg) => reg.schedule_id);
    res.json(scheduleIds);
  } catch (err) {
    console.error("Error fetching user registrations:", err);
    res.status(500).json({ error: "Error fetching user registrations" });
  }
});

app.get("/api/schedule/:id/registrations", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query(
      "SELECT COUNT(user_id) as registeredUsers FROM schedule_registrations WHERE schedule_id = ?",
      [id]
    );
    res.json({ registeredUsers: result[0].registeredUsers });
  } catch (err) {
    console.error("Error fetching registration count:", err);
    res.status(500).json({ error: "Error fetching registration count" });
  }
});

app.get("/api/coursework", authMiddleware, async (req, res) => {
  try {
    const { course, module } = req.query;
    if (!course && !module) {
      return res
        .status(400)
        .json({ error: "Course or module parameter is required." });
    }

    let queryParam;
    let queryField;
    if (req.user.role === "student") {
      queryField = "course";
      queryParam = course;
    } else if (req.user.role === "lecturer") {
      queryField = "module";
      queryParam = module;
    } else {
      return res.status(403).json({ message: "Access denied." });
    }

    const [files] = await db.query(
      `SELECT id, name, url, module, uploaded_at FROM coursework WHERE ${queryField} = ?`,
      [queryParam]
    );

    const groupedFiles = files.reduce((acc, file) => {
      const moduleName = file.module;
      if (!acc[moduleName]) {
        acc[moduleName] = {
          id: Object.keys(acc).length + 1,
          name: moduleName,
          files: [],
          color: "#D8F3E3",
        };
      }
      acc[moduleName].files.push({
        id: file.id,
        name: file.name,
        url: file.url,
      });
      return acc;
    }, {});

    const modules = Object.values(groupedFiles);
    res.json({ modules });
  } catch (err) {
    console.error("Error fetching coursework:", err);
    res.status(500).json({ error: "Error fetching coursework" });
  }
});

app.post(
  "/api/coursework/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    if (req.user.role !== "lecturer") {
      return res
        .status(403)
        .json({ message: "Access denied. Lecturers only." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const { module, course } = req.body;
    if (!module || !course) {
      return res.status(400).json({ error: "Module and course are required." });
    }

    const fileUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;

    try {
      await db.query(
        "INSERT INTO coursework (name, url, module, course, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?)",
        [
          req.file.originalname,
          fileUrl,
          module,
          course,
          req.user.id,
          formatToMySQLDateTime(new Date()),
        ]
      );
      res
        .status(201)
        .json({ message: "File uploaded successfully!", url: fileUrl });
    } catch (err) {
      console.error("Error uploading coursework:", err);
      res.status(500).json({ error: "Error uploading coursework" });
    }
  }
);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT} with WebSocket`)
);
