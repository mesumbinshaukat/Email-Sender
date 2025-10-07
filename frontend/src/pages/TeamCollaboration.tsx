import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Users, UserPlus, Settings, Crown, Shield, Eye, Edit, Mail } from 'lucide-react';

interface Team {
  _id: string;
  name: string;
  owner: {
    name: string;
    email: string;
  };
  members: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
    };
    role: string;
    permissions: any;
  }>;
  settings: any;
}

const TeamCollaboration = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'viewer'
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data } = await axios.get('/api/teams');
      setTeams(data);
    } catch (error) {
      toast.error('Failed to fetch teams');
    }
  };

  const createTeam = async (name: string) => {
    try {
      const { data } = await axios.post('/api/teams', { name });
      setTeams([data, ...teams]);
      setShowCreateForm(false);
      toast.success('Team created successfully!');
    } catch (error) {
      toast.error('Failed to create team');
    }
  };

  const inviteMember = async (teamId: string) => {
    try {
      const { data } = await axios.post(`/api/teams/${teamId}/invite`, inviteForm);
      setSelectedTeam(data);
      setShowInviteForm(false);
      setInviteForm({ email: '', role: 'viewer' });
      fetchTeams();
      toast.success('Member invited successfully!');
    } catch (error) {
      toast.error('Failed to invite member');
    }
  };

  const updateMemberRole = async (teamId: string, memberId: string, role: string) => {
    try {
      const { data } = await axios.put(`/api/teams/${teamId}/members/${memberId}`, { role });
      setSelectedTeam(data);
      fetchTeams();
      toast.success('Member role updated!');
    } catch (error) {
      toast.error('Failed to update member role');
    }
  };

  const removeMember = async (teamId: string, memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await axios.delete(`/api/teams/${teamId}/members/${memberId}`);
      fetchTeams();
      toast.success('Member removed');
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'editor': return <Shield className="h-4 w-4 text-blue-600" />;
      default: return <Eye className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-yellow-100 text-yellow-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            Team Collaboration
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage team members and collaborate on email campaigns
          </p>
        </motion.div>

        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Create Team
          </button>
        </div>

        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">Create New Team</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              createTeam(formData.get('name') as string);
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Team Name</label>
                <input
                  name="name"
                  placeholder="Marketing Team"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Create Team
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Teams List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold">Your Teams</h2>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {teams.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No teams yet. Create your first team to start collaborating!
                  </div>
                ) : (
                  teams.map(team => (
                    <div key={team._id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{team.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Owner: {team.owner.name}
                          </p>
                        </div>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {team.members.length} members
                        </span>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setSelectedTeam(team)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTeam(team);
                            setShowInviteForm(true);
                          }}
                          className="text-green-600 hover:text-green-700 text-sm"
                        >
                          Invite Member
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* Team Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {selectedTeam ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-6">{selectedTeam.name}</h2>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members ({selectedTeam.members.length})
                  </h3>

                  <div className="space-y-3">
                    {selectedTeam.members.map(member => (
                      <div key={member.user._id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{member.user.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.user.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${getRoleColor(member.role)}`}>
                            {getRoleIcon(member.role)}
                            {member.role}
                          </span>

                          <select
                            value={member.role}
                            onChange={(e) => updateMemberRole(selectedTeam._id, member._id, e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>

                          <button
                            onClick={() => removeMember(selectedTeam._id, member._id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Settings */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Team Settings
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Allow member invites</span>
                      <input
                        type="checkbox"
                        checked={selectedTeam.settings.allowMemberInvites}
                        onChange={(e) => {
                          // Update setting logic would go here
                          toast.info('Settings update coming soon');
                        }}
                        className="rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Require approval for campaigns</span>
                      <input
                        type="checkbox"
                        checked={selectedTeam.settings.requireApproval}
                        onChange={(e) => {
                          toast.info('Settings update coming soon');
                        }}
                        className="rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a team to view details
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a team from the list to see members and manage settings.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Invite Member Modal */}
        {showInviteForm && selectedTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Invite Team Member</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                inviteMember(selectedTeam._id);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      placeholder="user@example.com"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="viewer">Viewer - Can view campaigns and analytics</option>
                      <option value="editor">Editor - Can create and edit campaigns</option>
                      <option value="admin">Admin - Full access including team management</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                  >
                    Send Invite
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteForm(false)}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TeamCollaboration;
