const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Group = require("../models/Group");

const createToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const registerUser = async (req, res) => {
	try {
		const { name, email, password, country, whatsappNumber, group } = req.body;

		if (!name || !email || !password || !country || !whatsappNumber) {
			return res.status(400).json({
				message: "Name, email, password, country, and WhatsApp number are required"
			});
		}

		const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

		if (existingUser) {
			return res.status(409).json({ message: "Email is already registered" });
		}

		const normalizedCountry = country.trim();
		const hashedPassword = await bcrypt.hash(password, 10);

		const user = await User.create({
			name,
			email: email.toLowerCase().trim(),
			password: hashedPassword,
			country: normalizedCountry,
			whatsappNumber,
			group: null
		});

		let matchingGroup = await Group.findOne({
			country: { $regex: `^${normalizedCountry.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
			$expr: { $lt: [{ $size: "$members" }, "$maxMembers"] }
		}).sort({ groupNumber: 1 });

		if (matchingGroup) {
			matchingGroup.members.push(user._id);
			user.group = matchingGroup._id;
			await Promise.all([matchingGroup.save(), user.save()]);
		} else {
			const lastCountryGroup = await Group.findOne({
				country: { $regex: `^${normalizedCountry.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
			}).sort({ groupNumber: -1 });
			const newGroup = await Group.create({
				country: normalizedCountry,
				groupNumber: lastCountryGroup ? lastCountryGroup.groupNumber + 1 : 1,
				name: `${normalizedCountry} Community`,
				members: [user._id]
			});
			user.group = newGroup._id;
			await user.save();
			matchingGroup = newGroup;
		}

		return res.status(201).json({
			message: `Registration complete. You were added to ${matchingGroup.name}.`,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				country: user.country,
				whatsappNumber: user.whatsappNumber,
				group: user.group
			},
			group: matchingGroup
				? {
					id: matchingGroup._id,
					name: matchingGroup.name,
					country: matchingGroup.country,
					whatsappInviteLink: matchingGroup.whatsappInviteLink
				}
				: null
		});
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({ message: "Email is already registered" });
		}

		return res.status(500).json({ message: "Server error" });
	}
};

const loginUser = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ message: "Email and password are required" });
		}

		const user = await User.findOne({ email: email.toLowerCase().trim() });
		const passwordMatches = user && (await bcrypt.compare(password, user.password));

		if (!passwordMatches) {
			return res.status(401).json({ message: "Invalid email or password" });
		}

		return res.json({
			token: createToken(user._id.toString()),
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				country: user.country,
				whatsappNumber: user.whatsappNumber,
				group: user.group
			}
		});
	} catch (error) {
		return res.status(500).json({ message: "Server error" });
	}
};

module.exports = { registerUser, loginUser };
