const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: [true, "name is required"],
    lowercase: true,
  },
  bio: {
    type: String,
  },
  gender: {
    type: String,
    enum: ["Male", "Female"],
  },
  profilePicture: {
    type: String,
    default:
      this.gender === "Male"
        ? "https://akhi-data-dump.s3.ap-south-1.amazonaws.com/1718900201783_women.jpg"
        :"https://akhi-data-dump.s3.ap-south-1.amazonaws.com/1718899953028_men.jpeg",
  },
  email: {
    type: String,
    required: [true, "user must have email"],
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: "Invalid email",
    },
  },
  mailVerified:{
    type:Boolean,
    default:false
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  isOAuth: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    validate: {
      validator: function (value) {
        // Only validate if isOAuth is false and password is provided
        return !this.isOAuth && value && value.length >= 5;
      },
      message: "Password is required and must be at least 5 characters long.",
    },
    min: [5, "required minimum 5 characters"],
    select: false,
  },

  passwordConfirm: {
    type: String,
    validate: {
      validator: function (value) {
        // Only validate if isOAuth is false and password is provided
        return (
          !this.isOAuth && value && value.length >= 5 && value === this.password
        );
      },
      message: function (value) {
        value && value.length >= 5
          ? "Password is required and must be at least 5 characters long."
          : "Confirm password must be same as password";
      },
    },
  },
  passwordModifiedAt: {
    type: Date,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  friends: { type: [mongoose.Types.ObjectId], ref: "Users" },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwoordModifiedAt = Date.now() - 1000;
  next();
});
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });

  next();
});

userSchema.methods.correctPassword = async function (
  reqBodyPassword,
  dbPassword
) {
  return await bcrypt.compare(reqBodyPassword, dbPassword);
};

userSchema.methods.changedPasswordAfter = function (timestamp) {
  if (this.passwordModifiedAt) {
    const modifiedTimestamp = parseInt(
      this.passwordModifiedAt.getTime() / 1000,
      10
    );

    return modifiedTimestamp > timestamp;
  }
  return false;
};
userSchema.methods.passwordResetTokenGenerate = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000;//10min 
  return resetToken;
};

const user = mongoose.model("Users", userSchema);
module.exports = user;
