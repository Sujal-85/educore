import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Add CORS headers for relative path calls in development
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { to, subject, body, html } = req.body;

  if (!to || !subject || (!body && !html)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields: to, subject, and either body or html' 
    });
  }

  // Use Vercel environment variables or local .env
  const mailUser = process.env.VITE_EMAIL_USER;
  const mailPass = process.env.VITE_EMAIL_PASS;

  if (!mailUser || !mailPass) {
    return res.status(500).json({ 
      success: false, 
      message: 'Email configuration missing on server.' 
    });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: mailUser,
      pass: mailPass
    }
  });

  const mailOptions = {
    from: `"EduCore Portal" <${mailUser}>`,
    to,
    subject,
    text: body,
    html: html || body?.replace(/\n/g, '<br>')
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully', 
      info: info.response 
    });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send email.', 
      error: error.message 
    });
  }
}
