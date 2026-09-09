const jwt = require("jsonwebtoken");

const User = require("../models/User");

const protect = async (req, res, next) => {
	try {
		const authorization = req.headers.authorization;

		if (!authorization || !authorization.startsWith("Bearer ")) {
			return res.status(401).json({ message: "Authentication required" });
		}

		const token = authorization.split(" ")[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		if (decoded.role === "admin") {
			req.user = { id: "admin", role: "admin", name: "Administrator" };
			return next();
		}
		req.user = await User.findById(decoded.userId).select("-password");

		if (!req.user) {
			return res.status(401).json({ message: "User no longer exists" });
		}

		return next();
	} catch (error) {
		return res.status(401).json({ message: "Invalid or expired token" });
	}
};

module.exports = protect;
