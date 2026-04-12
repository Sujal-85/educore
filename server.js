import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

// Configure standard Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.VITE_EMAIL_USER,
    pass: process.env.VITE_EMAIL_PASS
  }
});

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.log("Transporter error:", error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

app.post('/api/send-email', async (req, res) => {
  const { to, subject, body, html } = req.body;

  if (!to || !subject || (!body && !html)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields: to, subject, and either body or html' 
    });
  }

  const mailOptions = {
    from: `"EduCore Portal" <${process.env.VITE_EMAIL_USER}>`,
    to,
    subject,
    text: body,
    html: html || body?.replace(/\n/g, '<br>')
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    res.status(200).json({ success: true, message: 'Email sent successfully', info: info.response });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email. Check if App Password is correct and Less Secure Apps/SMTP is enabled.', 
      error: error.message 
    });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend email server running at http://localhost:${PORT}`);
});
