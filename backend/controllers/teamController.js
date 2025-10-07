// express-async-handler removed - using native async/await
import Team from '../models/Team.js';
import User from '../models/User.js';

// @desc    Create team
// @route   POST /api/teams
// @access  Private
const createTeam = async (req, res) => { try {
  const { name } = req.body;
  const userId = req.user._id;

  const team = await Team.create({
    name,
    owner: userId,
    members: [{
      user: userId,
      role: 'admin',
      permissions: {
        sendEmails: true,
        manageContacts: true,
        viewAnalytics: true,
        manageTemplates: true,
        manageIntegrations: true
      },
      joinedAt: new Date()
    }]
  });

  res.status(201).json(team);
}  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); } };

// @desc    Get user's teams
// @route   GET /api/teams
// @access  Private
const getTeams = async (req, res) => { try {
  const userId = req.user._id;

  const teams = await Team.find({
    $or: [
      { owner: userId },
      { 'members.user': userId }
    ]
  }).populate('members.user', 'name email').populate('owner', 'name email');

  res.json(teams);
}  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); } };

// @desc    Get team details
// @route   GET /api/teams/:id
// @access  Private
const getTeam = async (req, res) => { try {
  const team = await Team.findById(req.params.id)
    .populate('members.user', 'name email')
    .populate('owner', 'name email');

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Check if user is member or owner
  const isMember = team.owner.toString() === req.user._id.toString() ||
                   team.members.some(m => m.user._id.toString() === req.user._id.toString());

  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to view this team');
  }

  res.json(team);
}  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); } };

// @desc    Invite member to team
// @route   POST /api/teams/:id/invite
// @access  Private
const inviteMember = async (req, res) => { try {
  const { email, role } = req.body;
  const teamId = req.params.id;

  const team = await Team.findById(teamId);

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Check if user is owner or admin
  if (team.owner.toString() !== req.user._id.toString()) {
    const member = team.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member || member.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to invite members');
    }
  }

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if already a member
  const existingMember = team.members.find(m => m.user.toString() === user._id.toString());
  if (existingMember) {
    res.status(400);
    throw new Error('User is already a team member');
  }

  // Add to team
  team.members.push({
    user: user._id,
    role: role || 'viewer',
    permissions: getDefaultPermissions(role || 'viewer')
  });

  await team.save();

  res.json(team);
}  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); } };

// @desc    Update member role
// @route   PUT /api/teams/:id/members/:memberId
// @access  Private
const updateMemberRole = async (req, res) => { try {
  const { role, permissions } = req.body;
  const teamId = req.params.id;
  const memberId = req.params.memberId;

  const team = await Team.findById(teamId);

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Check if user is owner or admin
  if (team.owner.toString() !== req.user._id.toString()) {
    const member = team.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member || member.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to update members');
    }
  }

  const memberIndex = team.members.findIndex(m => m._id.toString() === memberId);
  if (memberIndex === -1) {
    res.status(404);
    throw new Error('Member not found');
  }

  team.members[memberIndex].role = role;
  if (permissions) {
    team.members[memberIndex].permissions = permissions;
  } else {
    team.members[memberIndex].permissions = getDefaultPermissions(role);
  }

  await team.save();
  res.json(team);
}  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); } };

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:memberId
// @access  Private
const removeMember = async (req, res) => { try {
  const teamId = req.params.id;
  const memberId = req.params.memberId;

  const team = await Team.findById(teamId);

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Check if user is owner or admin
  if (team.owner.toString() !== req.user._id.toString()) {
    const member = team.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member || member.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to remove members');
    }
  }

  team.members = team.members.filter(m => m._id.toString() !== memberId);
  await team.save();

  res.json(team);
}  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); } };

// Helper functions
const getDefaultPermissions = (role) => {
  switch (role) {
    case 'admin':
      return {
        sendEmails: true,
        manageContacts: true,
        viewAnalytics: true,
        manageTemplates: true,
        manageIntegrations: true
      };
    case 'editor':
      return {
        sendEmails: true,
        manageContacts: true,
        viewAnalytics: true,
        manageTemplates: true,
        manageIntegrations: false
      };
    default: // viewer
      return {
        sendEmails: false,
        manageContacts: false,
        viewAnalytics: true,
        manageTemplates: false,
        manageIntegrations: false
      };
  }
};

export {
  createTeam,
  getTeams,
  getTeam,
  inviteMember,
  updateMemberRole,
  removeMember
};
