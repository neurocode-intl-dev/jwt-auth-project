const { Router } = require("express");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { getMe, getAllUsers } = require("../controllers/user.controller");

const router = Router();

// All routes below require a valid access token
router.get("/me", authenticate, getMe);
router.get("/", authenticate, authorize("admin"), getAllUsers);

module.exports = router;
