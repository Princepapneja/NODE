import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const { Schema } = mongoose;

const userSchema = new Schema(
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
    isVerified: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      default: "patient",
    },
    access: {
      type: String,
      default: "restricted",
      enum: ["restricted", "full", "blocked"]
    },
    password: {
      type: String,
      required: [true, "Password is required"]

    },
    otp: { type: String },
    
    notification: {
      type: Boolean,
      default: true
    },
    bio: {
      type: String,
    },
    device: {
      type: String,
    },
    gender: {
      type:String,
      enum:["male","female","other"]
    },
    age: Number,
    address: String,
    phone: String,
    city: String,
    state: String,
    country: String,
    zip: String,
    timezone:String,
    systemGeneratedPass:{
     type:Boolean,
     default:false 
    }
  },

  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      const hashedPassword = await bcrypt.hash(this.password, 10);
      this.password = hashedPassword;
    }

    this.fullName = `${this.firstName} ${this.lastName}`;

    next();
  } catch (error) {
    next(error);
  }
});
const updateMiddleware = async function (next, f) {
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

userSchema.pre(['updateOne', 'findByIdAndUpdate', 'findOneAndUpdate'], updateMiddleware);

userSchema.methods.isPasswordMatch = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    return false;
  }
};
// userSchema.virtual('fullName').get(function() {
//   return `${this.firstName} ${this.lastName}`;
// });
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      access: this.access
    },
    process.env.ACCESS_TOKEN_SECRET
  );
};

const User = mongoose.model("User", userSchema);

export default User;
