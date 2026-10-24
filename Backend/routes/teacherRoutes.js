const express = require("express");
const router = express.Router();

const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const { requireLogin, requireTeacher } = require("../middleware/auth");

router.use(requireLogin, requireTeacher);
router.get("/assignments", async (req, res) => {
  try {
    const assignments = await Assignment.find({ createdBy: req.session.userId }).sort({ dueDate: 1 });
    res.json(assignments);
  } catch (err) {
    console.log("Fetch assignments error: " + err);
    res.status(500).json({ message: "Server error fetching assignments." });
  }
});

router.post("/assignments", async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;

    if (!title || !description || !dueDate) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newAssignment = new Assignment({
      title: title,
      description: description,
      dueDate: dueDate,
      createdBy: req.session.userId
    });

    await newAssignment.save();

    res.status(201).json({ message: "Assignment created successfully.", assignment: newAssignment });
  } catch (err) {
    console.log("Create assignment error: " + err);
    res.status(500).json({ message: "Something went wrong creating assignment." });
  }
});

router.get("/assignments/:id/submissions", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    if (assignment.createdBy.toString() !== req.session.userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const submissions = await Submission.find({ assignment: assignment._id }).populate("student", "name email");

    res.json({ assignment, submissions });
  } catch (err) {
    console.log("View submissions error: " + err);
    res.status(500).json({ message: "Server error fetching submissions." });
  }
});

router.post("/submissions/:id/grade", async (req, res) => {
  try {
    const { grade, feedback } = req.body;

    if (grade === undefined || grade === null || grade === "") {
      return res.status(400).json({ message: "Grade is required." });
    }

    const submission = await Submission.findById(req.params.id).populate("assignment");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found." });
    }

    if (submission.assignment.createdBy.toString() !== req.session.userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    submission.grade = Number(grade);
    submission.feedback = feedback || "";
    await submission.save();

    res.json({ message: "Submission graded successfully.", submission });
  } catch (err) {
    console.log("Grade submission error: " + err);
    res.status(500).json({ message: "Something went wrong grading submission." });
  }
});

module.exports = router;