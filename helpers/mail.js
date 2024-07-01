import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'prince.beatum@gmail.com', 
        pass: 'hmsq ipgn oawf zmrr'
    },
    tls: {
        rejectUnauthorized: false // This is to handle self-signed certificates
    }
});

async function sendEmail(to, subject, text, html) {
    try {
        const mailOptions = {
            from: 'prince.beatum@gmail.com', // Sender address must be the authenticated user's email
            to, // List of recipients
            subject, // Subject line
            text, // Plain text body
            html // HTML body
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId); // Log the message ID
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error; // Re-throw the error after logging it
    }
}

export { sendEmail };
