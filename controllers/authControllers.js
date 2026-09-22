const User = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { allowedRoles } = require("../middlewares/verifyRoles");
const { sendConfirmationEmail } = require("../services/emailService");
const { sendResetEmail } = require("../services/emailService");
const { renderResponsePage } = require("../services/emailService");
const crypto = require("crypto");

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate a password reset token
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // Token valid for 1 hour
    await user.save();

    const resetUrl = `http://localhost:5000/auth/reset-password/${token}`;
    try {
      await sendResetEmail(user.email, resetUrl);
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
      return res.status(502).json({
        message: "Could not send the password reset email. Please try again later.",
      });
    }

    res
      .status(200)
      .json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
      error: error.message,
    });
  }
};

/////////////// register

const register = async (req, res) => {
  const { firstName, lastName, email, password, role, dateOfBirth } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !password || !dateOfBirth) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate age (must be 18 or older)
  const today = new Date();
  const dob = new Date(dateOfBirth);
  const age = today.getFullYear() - dob.getFullYear();
  const isOlderThan18 =
    age > 18 ||
    (age === 18 && today >= new Date(dob.setFullYear(today.getFullYear())));
  if (!isOlderThan18) {
    return res
      .status(400)
      .json({ message: "You must be at least 18 years old" });
  }

  // Validate role
  const roles = role ? (Array.isArray(role) ? role : [role]) : undefined;
  if (roles && !roles.every((r) => allowedRoles.includes(r))) {
    return res.status(400).json({ message: "Role does not exist" });
  }

  try {
    // Check for duplicate email
    const duplicatedEmail = await User.findOne({ email }).exec();
    if (duplicatedEmail) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: roles,
      dateOfBirth,
      isConfirmed: false, // Add isConfirmed field
      confirmationToken: crypto.randomBytes(32).toString("hex"), // Token for email confirmation
    });

    // Send confirmation email (best-effort: don't fail registration if email delivery fails)
    try {
      await sendConfirmationEmail(email, newUser.confirmationToken);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
    }

    return res.status(201).json({
      message:
        "User created successfully. Please check your email to confirm your account.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

////////// confirmation token
const confirmationbytoken = async (req, res) => {
  const { token } = req.params;

  try {
    // Find the user by the confirmation token
    const user = await User.findOne({ confirmationToken: token });

    if (!user) {
      return res
        .status(404)
        .send(renderResponsePage("Invalid confirmation token", false));
    }

    // Update the user's status to confirmed
    user.isConfirmed = true;
    user.confirmationToken = null; // Clear the token
    await user.save();

    res
      .status(200)
      .send(renderResponsePage("Email confirmed successfully!", true));
  } catch (error) {
    console.error("Error during email confirmation:", error); // Log the error details
    res
      .status(500)
      .send(renderResponsePage("Server error. Please try again later.", false));
  }
};
/////////////login

const login = async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Find the user by email
    const foundUser = await User.findOne({ email }).exec();

    if (!foundUser) {
      return res.status(401).json({ message: "User does not exist" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Wrong password" });
    }

    // Generate JWT token
    const accessToken = jwt.sign(
      {
        userInfo: {
          id: foundUser._id,
          role: foundUser.role,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      accessToken,
      id: foundUser._id,
      email: foundUser.email,
      role: foundUser.role,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
/////reset-password
const resetpassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send("Invalid or expired token.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10); // Hash the new password
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).send("Password has been reset successfully.");
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).send("Server error. Please try again later.");
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  confirmationbytoken,
  resetpassword,
};
