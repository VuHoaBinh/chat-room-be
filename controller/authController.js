const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { email, password } = req.body;
  console.log("Register attempt:", { email, password });

  try {
    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during user.save():", error.message, error);
    res.status(400).json({ error: error.message });
  }
};
exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt:", { email, password });
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found");
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // const hashedPassword = await bcrypt.hash(password, 10);
    // console.log("Login attempt:", hashedPassword);
    // console.log("Login attempt:", user.password);
    // const isMatch = await bcrypt.compare(hashedPassword, user.password);
    // if (!isMatch) {
    //   console.log("Password does not match");
    //   return res.status(400).json({ message: "Invalid credentials" });
    // }
    console.log("Login successful");
    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({ error: error.message });
  }
};
