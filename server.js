// 1. Import required core modules and third-party packages
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 8080;

// 2. Middleware Configuration
// Essential for reading incoming form data (POST body)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve only the public parts of the site. The project folder also holds
// server.js, package.json, README.md and .env, which must never be downloadable,
// so we list exactly what visitors may fetch instead of exposing the whole folder.
const PUBLIC_DIRS = ['image', 'js', 'vendor', 'fonts'];
PUBLIC_DIRS.forEach((dir) => {
    app.use('/' + dir, express.static(path.join(__dirname, dir)));
});

// Top-level pages and the stylesheet. Any new *.html page added to the project
// folder is picked up automatically on the next restart.
const PUBLIC_FILES = new Set(
    fs.readdirSync(__dirname).filter((f) => f.endsWith('.html')).concat(['style.css'])
);
app.get('/:file', (req, res, next) => {
    if (!PUBLIC_FILES.has(req.params.file)) return next();
    res.sendFile(path.join(__dirname, req.params.file));
});

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
        'phone-number': phoneNumber,
        'estimate-summary': estimateSummary // optional, filled by the fence planner on index.html
    } = req.body;

    // Optional free-text notes / fence plan. Plain text only, capped so the email stays sane.
    const notes = typeof estimateSummary === 'string' ? estimateSummary.trim().slice(0, 2000) : '';

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
            ${notes ? `
            Fence Plan / Notes:
            --------------------------------------------------
            ${notes.replace(/\n/g, '\n            ')}
            ` : ''}
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

// Anything else is not part of the site
app.use((req, res) => {
    res.status(404).send('Page not found');
});

// 6. Launch & Initialize the Web Server Framework
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Nature Care Security Server active and running.`);
    console.log(`🌐 Open in your browser: http://localhost:${PORT}`);
    console.log(`====================================================`);
});