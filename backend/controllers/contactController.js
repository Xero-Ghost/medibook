import ContactMessage from '../models/ContactMessage.js';

export async function createContactMessage(req, res, next) {
  try {
    const { name, email, topic, message } = req.body;
    if (typeof name !== 'string' || !name.trim() ||
        typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof topic !== 'string' || !topic.trim() ||
        typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Enter your name, a valid email address, a topic, and a message.' });
    }
    if (name.length > 80 || topic.length > 80 || message.length > 2000) {
      return res.status(400).json({ message: 'Name and topic must be 80 characters or fewer; messages must be 2,000 characters or fewer.' });
    }
    const contactMessage = await ContactMessage.create({ name, email, topic, message });
    res.status(201).json({ message: 'Thanks for reaching out. Our team will be in touch soon.', contactMessageId: contactMessage._id });
  } catch (error) {
    next(error);
  }
}

export async function listContactMessages(_req, res, next) {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(50);
    res.json({ messages });
  } catch (error) {
    next(error);
  }
}
