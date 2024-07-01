import otpGenerator from 'otp-generator';
import mailSender from '../utils/mailSender.js';
import jwt from 'jsonwebtoken';

async function generateOTP(email, type="sign", user) {
    const otp = otpGenerator.generate(6, { digits: true, specialChars: false, upperCaseAlphabets: false, lowerCaseAlphabets: false });
    const expirationTime = Date.now() + 5 * 60 * 1000;
    console.log(user, "user");
   
    try {
        let  mailTemp
        if(type==="forgot"){
             mailTemp={
                email,
                name:user.fullName,
                text:otp,
                heading:"Forgot Password",
                type:"forgot"
            }
        }else if(type==="sign"){

              mailTemp={
                email,
                name:user.fullName,
                text:otp,
                heading:"Verification",
                type
            }
        }
      
         mailSender(mailTemp, "otp")

        return { type, otp, expirationTime  };
    } catch (error) {
        console.error('Failed to send OTP:', error);
        throw new Error('Failed to send OTP');
    }
}

export { generateOTP };
