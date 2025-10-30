import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, html, text } = req.body;

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, and html or text' });
    }

    // استخدام Nodemailer أو خدمة بريد إلكتروني
    // هنا مثال باستخدام Gmail SMTP أو أي SMTP آخر
    const nodemailer = require('nodemailer');

    // إعدادات SMTP - يمكنك استخدام Gmail, SendGrid, Mailgun, أو أي خدمة أخرى
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // بريدك الإلكتروني
        pass: process.env.SMTP_PASS, // كلمة المرور أو App Password
      },
    });

    // إرسال البريد
    const info = await transporter.sendMail({
      from: `"SAB Store" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html,
    });

    console.log('Email sent successfully:', info.messageId);
    
    return res.status(200).json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully' 
    });

  } catch (error: any) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
}
