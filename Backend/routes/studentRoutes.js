const express = require("express");
const router = express.Router();

const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const { requireLogin, requireStudent } = require("../middleware/auth");
const upload = require("../config/upload");
const { uploadBufferToCloudinary } = require("../utils/cloudinaryUpload");

router.use(requireLogin, requireStudent);

router.get("/assignments", async (req, res) => {
  try {
    const assignments = await Assignment.find().sort({ dueDate: 1 });
    const mySubmissions = await Submission.find({ student: req.session.userId });

    const assignmentsWithStatus = assignments.map((assignment) => {
      const submission = mySubmissions.find(
        (s) => s.assignment.toString() === assignment._id.toString()
      );

      let status = "Not Submitted";
      if (submission && submission.grade !== null) {
        status = "Graded";
      } else if (submission) {
        status = "Submitted";
      }

      return {
        _id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        createdBy: assignment.createdBy,
        status: status,
        submission: submission || null
      };
    });

    res.json(assignmentsWithStatus);
  } catch (err) {
    console.log("Fetch student assignments error: " + err);
    res.status(500).json({ message: "Server error fetching assignments." });
  }
});

router.post("/assignments/:id/submit", function (req, res) {
  upload.single("file")(req, res, async function (uploadError) {
    try {
      const assignment = await Assignment.findById(req.params.id);

      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found." });
      }

      if (uploadError) {
        return res.status(400).json({ message: uploadError.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Please choose a file to upload." });
      }

      const existingSubmission = await Submission.findOne({
        assignment: assignment._id,
        student: req.session.userId
      });

      if (existingSubmission) {
        return res.status(400).json({ message: "You have already submitted this assignment." });
      }

      const result = await uploadBufferToCloudinary(req.file.buffer, "lms-submissions");

      const newSubmission = new Submission({
        assignment: assignment._id,
        student: req.session.userId,
        fileUrl: result.secure_url
      });

      await newSubmission.save();

      res.status(201).json({
        message: "Assignment submitted successfully.",
        submission: newSubmission
      });
    } catch (err) {
      console.log("Submit assignment error: " + err);
      res.status(500).json({ message: "Something went wrong uploading submission." });
    }
  });
});

router.get("/grades", async (req, res) => {
  try {
    const submissions = await Submission.find({
      student: req.session.userId,
      grade: { $ne: null }
    }).populate("assignment", "title description dueDate");

    res.json(submissions);
  } catch (err) {
    console.log("Fetch grades error: " + err);
    res.status(500).json({ message: "Server error fetching grades." });
  }
});

module.exports = router;