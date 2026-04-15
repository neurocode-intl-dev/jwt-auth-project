const { Router } = require("express");
const { register, login, refresh, logout } = require("../controllers/auth.controller");

const router = Router();

// Public routes – no authentication required
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);  // uses HttpOnly cookie
router.post("/logout", logout);

module.exports = router;
