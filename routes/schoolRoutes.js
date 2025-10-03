
const express = require("express");
const School = require("../models/School");

const router = express.Router();

// ✅ Create School
router.post("/", async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;
    const school = new School({ name, address, latitude, longitude });
    await school.save();
    res.status(201).json(school);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get All Schools (for table display)
router.get("/", async (req, res) => {
  try {
    const schools = await School.find();
    res.json(schools);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Update School
router.put("/:id", async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;
    const updated = await School.findByIdAndUpdate(
      req.params.id,
      { name, address, latitude, longitude },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Delete School
router.delete("/:id", async (req, res) => {
  try {
    await School.findByIdAndDelete(req.params.id);
    res.json({ message: "School deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
