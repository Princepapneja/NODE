import mailSender from "../utils/mailSender.js";





    const templateData = {
        patient: 'Jonny',
        heading: "appointment", 
        status: "cancelled", 
        startDate: "30/05/2024", 
        endDate: "30/05/2024", 
        start:"11:30 AM",
        end:"12:00 PM",
        clinical: 'Dr. Prince',
        email: 'uday.beatum@gmail.com'
    };

    mailSender(templateData,"appointment")
    

// app.get("/send-otp-email", async (req, res) => {
//     const recipientEmail = 'prince.beatum@gmail.com';
//     const subject = 'OTP Verification';
//     const templateName = 'otp.email';
//     const templateData = {
//         heading: "verification",
//         text: "879450",
//         type: "otp",
//         recipientName: 'John Doe',
//         text: 903823,
//         supportEmail: 'help23@gmail.com',
//     };

//     try {
//         // const templatePath = path.join(__dirname, '/views', `${templateName}.ejs`);
//         // const html = await ejs.renderFile(templatePath, templateData);
//         // await sendEmail(recipientEmail, subject, "", html);
//         // res.send('OTP Email sent successfully');
//         res.render("otp.email.ejs", templateData);
//     } catch (error) {
//         console.error('Error sending OTP Email:', error);
//         res.status(500).send('Error sending OTP Email');
//     }
// });

// // Route for sending password reset OTP email
// app.get("/reset-pass-otp", async (req, res) => {
//     const recipientEmail = 'prince.beatum@gmail.com'; 
//     const subject = 'Password Reset OTP';
//     const templateName = 'otp.email'; 
//     const templateData = {
//         heading: "forgot",
//         text: "452398",
//         type: "forgot",
//         heading: "forgot password", 
//         recipientName: 'John Doe', 
//         text: 123456, 
//         supportEmail: 'help23@gmail.com',
//     };

//     try {
//         // const templatePath = path.join(__dirname, '/views', `${templateName}.ejs`);
//         // const html = await ejs.renderFile(templatePath, templateData);
//         // await sendEmail(recipientEmail, subject, "", html);
//         // res.send('Password Reset OTP Email sent successfully');
//         res.render("otp.email.ejs", templateData);
//     } catch (error) {
//         console.error('Error sending Password Reset OTP Email:', error);
//         res.status(500).send('Error sending Password Reset OTP Email');
//     }
// });

// // Route for generating password by admin email 
// app.get("/generated-pass", async (req, res) => {
//     const recipientEmail = 'prince.beatum@gmail.com'; 
//     const subject = 'Welcome to health - Your New Account has been created';
//     const templateName = 'otp.email'; 
//     const templateData = {
//         heading: "password",
//         text: "452398*&4hb",
//         type: "password",
//         recipientName: 'John Doe', 
//         password: "123$3f2tcs2^47", 
//         userName:"abc12345",
//         supportEmail: 'help23@gmail.com',
//     };

//     try {
//         // const templatePath = path.join(__dirname, '/views', `${templateName}.ejs`);
//         // const html = await ejs.renderFile(templatePath, templateData);
//         // await sendEmail(recipientEmail, subject, "", html);
//         // res.send('Email sended successfully');
//         res.render("otp.email.ejs", templateData);
//     } catch (error) {
//         console.error('Error sending email:', error);
//         res.status(500).send('Error sending email');
//     }
// });

// // Route for sending successfully password changed email 
// app.get("/pass-changed", async (req, res) => {
//     const recipientEmail = 'prince.beatum@gmail.com'; 
//     const subject = 'Password Reset OTP';
//     const templateName = 'passwordChanged.email'; 
//     const templateData = {
//         recipientName: 'John Doe', 
//         supportEmail: 'help23@gmail.com',
//     };

//     try {
//         // const templatePath = path.join(__dirname, '/views', `${templateName}.ejs`);
//         // const html = await ejs.renderFile(templatePath, templateData);
//         // await sendEmail(recipientEmail, subject, "", html);
//         // res.send('Password changed successfully');
//         res.render("passwordChanged.email.ejs", templateData);

//     } catch (error) {
//         console.error('Error sending email:', error);
//         res.status(500).send('Error sending email');
//     }
// });

// // Route for generating appointment-confirmation email 
// app.get("/appointment-confirmation", async (req, res) => {
//     const recipientEmail = 'prince.beatum@gmail.com'; 
//     const subject = 'Your appointment has been successfully scheduled';
//     const templateName = 'appointment.email'; 
//     const templateData = {
//         patientName: 'John Doe',
//         heading: "appointment", 
//         status: "confirmed", 
//         startDate: "30/05/2024", 
//         endDate: "30/05/2024", 
//         startTime:"11:30 AM",
//         endTime:"12:00 PM",
//         clinician: 'Dr. Prince',
//     };

//     try {
//         // const templatePath = path.join(__dirname, '/views', `${templateName}.ejs`);
//         // const html = await ejs.renderFile(templatePath, templateData);
//         // await sendEmail(recipientEmail, subject, "", html);
//         // res.send('email sent successfully');
//         res.render("appointment.email.ejs", templateData);

//     } catch (error) {
//         console.error('Error sending email:', error);
//         res.status(500).send('Error sending email');
//     }
// });

// // Route for generating appointment-cancellation email 
// app.get("/appointment-cancellation", async (req, res) => {
//     const recipientEmail = 'prince.beatum@gmail.com'; 
//     const subject = 'Your appointment has been cancelled';
//     const templateName = 'appointment.email'; 
//     const templateData = {
//         patientName: 'Jonny',
//         heading: "appointment", 
//         status: "cancelled", 
//         startDate: "30/05/2024", 
//         endDate: "30/05/2024", 
//         startTime:"11:30 AM",
//         endTime:"12:00 PM",
//         clinician: 'Dr. Prince',
//     };

//     try {
//         // const templatePath = path.join(__dirname, '/views', `${templateName}.ejs`);
//         // const html = await ejs.renderFile(templatePath, templateData);
//         // await sendEmail(recipientEmail, subject, "", html);
//         // res.send('email sent successfully');
//         res.render("appointment.email.ejs", templateData);
//     } catch (error) {
//         console.error('Error sending email:', error);
//         res.status(500).send('Error sending email');
//     }
// });
