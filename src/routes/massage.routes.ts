import express from "express";
import Message from "../models/message.model";

const router = express.Router();

// ✅ Send a private message (alternative to socket)
router.post("/private", async (req, res) => {
  //const senderId = (req as any).user.id;
  const { senderId, receiverId, content } = req.body;

  if (!receiverId || !content) {
    return res
      .status(400)
      .json({ message: "receiverId and content are required" });
  }

  try {
    const message = await Message.create({
      senderId,
      receiverId,
      content,
      chatType: "private",
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: "Failed to send message", error: err });
  }
});

// ✅ Get private message history with another user
router.get("/private/:otherUserId", async (req, res) => {
  const currentUserId = (req as any).user.id;
  const { otherUserId } = req.params;

  try {
    const messages = await Message.find({
      chatType: "private",
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages", error: err });
  }
});

export { router as messageRoutes };
