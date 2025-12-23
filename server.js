const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const fs = require('fs');

const app = express();
const PORT = 5000;
const testimonialsFile = path.join(__dirname, 'data', 'testimonials.json');

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Email endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { name, email, service, budget, message } = req.body;

    if (!name || !email || !service || !budget || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'nikbenhtml@gmail.com',
      subject: `Nowy projekt od ${name} - ${service}`,
      html: `
        <h2>Nowa wiadomość z formularza kontaktu</h2>
        <p><strong>Imię i Nazwisko:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Typ projektu:</strong> ${service}</p>
        <p><strong>Budżet:</strong> ${budget}</p>
        <p><strong>Wiadomość:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Wiadomość wysłana pomyślnie!' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Błąd podczas wysyłania wiadomości' });
  }
});

// Testimonials endpoints
app.get('/api/testimonials', (req, res) => {
  try {
    const data = fs.readFileSync(testimonialsFile, 'utf8');
    const testimonials = JSON.parse(data || '[]');
    res.json(testimonials);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/testimonials', (req, res) => {
  try {
    const { name, position, message, rating } = req.body;

    if (!name || !position || !message || !rating) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const data = fs.readFileSync(testimonialsFile, 'utf8');
    let testimonials = JSON.parse(data || '[]');

    const newTestimonial = {
      id: Date.now(),
      name,
      position,
      message,
      rating: parseInt(rating),
      date: new Date().toISOString()
    };

    testimonials.push(newTestimonial);
    fs.writeFileSync(testimonialsFile, JSON.stringify(testimonials, null, 2));

    res.json({ success: true, testimonial: newTestimonial });
  } catch (error) {
    console.error('Testimonial error:', error);
    res.status(500).json({ error: 'Błąd podczas dodawania opinii' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
