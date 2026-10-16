// 1. Import required core modules and third-party packages
require('dotenv').config();
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 8080;

// 2. Middleware Configuration
// Essential for reading incoming form data (POST body)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static assets (HTML, CSS, JS, and image folders) directly from the project root
app.use(express.static(__dirname));
app.use('/image', express.static(path.join(__dirname, 'image')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// 3. Email Transporter Configuration (Nodemailer)
// Credentials are pulled from environment variables (.env file locally,
// or your host's "Environment Variables" dashboard in production).
// NEVER hardcode real email/password values directly in this file.
const transporter = nodemailer.createTransport({
    service: 'gmail', // e.g., 'gmail', 'outlook', 'yahoo', or SMTP configuration
    auth: {
        user: process.env.EMAIL_USER,   // Your corporate or system email address
        pass: process.env.EMAIL_PASS    // Your Gmail App Password (NOT your regular login password)
    }
});

// 4. Form Submission Route Handler
app.post('/submit-assessment', (req, res) => {
    // Extracting fields sent from your index.html form attributes
    const { 
        'full-name': fullName, 
        'company-name': companyName, 
        'industry-select': industry, 
        'property-size': propertySize, 
        'primary-threat': primaryThreat, 
        'email-address': emailAddress, 
        'phone-number': phoneNumber 
    } = req.body;

    // Basic validation - catches empty/malformed submissions before we try to email them
    if (!fullName || !companyName || !emailAddress || !phoneNumber) {
        return res.status(400).sendFile(path.join(__dirname, 'error.html'));
    }

    // Log tracking inside your terminal console
    console.log('--- New Security Assessment Received ---');
    console.log(req.body);

    // Constructing the Email Content Layout
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_TO, // Where you want to receive the alerts
        subject: `🚨 Enterprise Security Assessment Request: ${companyName}`,
        text: `
            You have received a new perimeter security inquiry.
            
            Customer Details:
            --------------------------------------------------
            Full Name: ${fullName}
            Company/Organization: ${companyName}
            Target Industry Sector: ${industry}
            Approx. Boundary Length: ${propertySize} KM
            Primary Security Threat Vector: ${primaryThreat}
            
            Contact Information:
            --------------------------------------------------
            Corporate Email: ${emailAddress}
            Contact Phone Number: ${phoneNumber}
            
            Submitted on: ${new Date().toLocaleString()}
        `
    };

    // Trigger the automated email transmission process
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Nodemailer Error:', error);
            return res.status(500).sendFile(path.join(__dirname, 'error.html'));
        }
        console.log('Email successfully sent: ' + info.response);
        res.sendFile(path.join(__dirname, 'success.html'));
    });
});

// 5. Fallback Default Route to Serve Your Existing Homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 6. Launch & Initialize the Web Server Framework
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Nature Care Security Server active and running.`);
    console.log(`🌐 Open in your browser: http://localhost:${PORT}`);
    console.log(`====================================================`);
});