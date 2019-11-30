const express = require("express");
const router = express.Router();
const multer = require("multer");

const User = require("../../models/User");

const uuid = require("uuid/v4");

let uuidStore = "";
let extStore = "";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    uuidStore = uuid();
    extStore = file.originalname.split(".");
    cb(null, uuidStore + "." + extStore[extStore.length - 1]);
  }
});

const upload = multer({ storage: storage });

router.post("/image", upload.single("image"), (req, res) => {
  // console.log(req.file);
  User.findOne({ _id: req.body.id })
    .then(user => {
      console.log(user);
      user.image = uuidStore + "." + extStore[extStore.length - 1];
      user.save();
    })
    .catch(err => console.log(err));
  res.json({ message: "success" });
  // console.log(req.body.id);
});

module.exports = router;
