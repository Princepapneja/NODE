import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const { Schema } = mongoose;

const adminSchema = new Schema(
  {

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    fullName: {
      type: String,
    },
    image: {
      type: String
    },
    phone: {
      type: String
    },
    role: {
      type: String,
      default: "admin",
    },
    access: {
      type: String,
      default: "full",
      enum: ["full", "blocked"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      
    },
    otp: { type: String },
    systemGeneratedPass:{
      type:Boolean,
      default:true 
     }
    
  },
  { timestamps: true }
);

adminSchema.pre("save", async function (next) {
  try {

    if (!this.isModified("password")) return next();
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    this.fullName = `${this.firstName} ${this.lastName}`;
    next();
  } catch (error) {
    next(error);
  }
});

adminSchema.methods.isPasswordMatch = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    return false;
  }
};

adminSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,

    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};
const updateMiddleware = async function (next,f) {
  try {
    const data = this.getUpdate();
    const originalData = await this.model.findOne(this.getQuery()); 
    if (data.firstName !== undefined || data.lastName !== undefined) {
      const firstName = data.firstName !== undefined ? data.firstName : originalData.firstName;
      const lastName = data.lastName !== undefined ? data.lastName : originalData.lastName;
      data.fullName = `${firstName} ${lastName}`;
    }

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      data.password = hashedPassword;
    }

    next();
  } catch (error) {
    next(error);
  }
};

adminSchema.pre(['updateOne', 'findByIdAndUpdate', 'findOneAndUpdate'], updateMiddleware);



export const Admin = mongoose.model("Admin", adminSchema);
