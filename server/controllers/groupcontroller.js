const Group = require("../models/Group");
const User = require("../models/User");

const getGroups = async (req, res) => {
	try {
		const groups = await Group.find().populate("members", "name country whatsappNumber").sort({ country: 1, groupNumber: 1 });
		return res.json(groups);
	} catch (error) {
		return res.status(500).json({ message: "Server error" });
	}
};

const createGroup = async (req, res) => {
	try {
		const { country, groupNumber, name, whatsappInviteLink, maxMembers } = req.body;
		const parsedGroupNumber = Number(groupNumber);
		const parsedMaxMembers = maxMembers === undefined ? 20 : Number(maxMembers);

		if (!country?.trim() || !name?.trim() || !Number.isInteger(parsedGroupNumber) || parsedGroupNumber < 1 || !Number.isInteger(parsedMaxMembers) || parsedMaxMembers < 2) {
			return res.status(400).json({ message: "Country, group number, and name are required" });
		}

		const group = await Group.create({
			country: country.trim(),
			groupNumber: parsedGroupNumber,
			name: name.trim(),
			whatsappInviteLink: whatsappInviteLink?.trim() || "",
			maxMembers: parsedMaxMembers,
			members: [req.user._id]
		});
		req.user.group = group._id;
		await req.user.save();
		return res.status(201).json(group);
	} catch (error) {
		return res.status(500).json({ message: "Server error" });
	}
};

const joinGroup = async (req, res) => {
	try {
		const group = await Group.findById(req.params.id);

		if (!group) {
			return res.status(404).json({ message: "Group not found" });
		}

		if (group.members.some((memberId) => memberId.equals(req.user._id))) {
			return res.status(409).json({ message: "You are already a member of this group" });
		}

		if (group.members.length >= group.maxMembers) {
			return res.status(409).json({ message: "This group is full" });
		}

		if (req.user.group) {
			return res.status(409).json({ message: "Leave your current group before joining another" });
		}

		group.members.push(req.user._id);
		req.user.group = group._id;
		await Promise.all([group.save(), req.user.save()]);

		return res.json({ message: "You joined the group", group });
	} catch (error) {
		return res.status(500).json({ message: "Server error" });
	}
};

const leaveGroup = async (req, res) => {
	try {
		const group = await Group.findById(req.params.id);

		if (!group) {
			return res.status(404).json({ message: "Group not found" });
		}

		group.members = group.members.filter((memberId) => !memberId.equals(req.user._id));
		req.user.group = null;
		await Promise.all([group.save(), req.user.save()]);

		return res.json({ message: "You left the group" });
	} catch (error) {
		return res.status(500).json({ message: "Server error" });
	}
};

module.exports = { getGroups, createGroup, joinGroup, leaveGroup };
