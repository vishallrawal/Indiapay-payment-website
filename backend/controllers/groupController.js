import { db } from '../config/db.js';

// 1. Create Split Bill Group
export const createSplitGroup = async (req, res) => {
  const { groupName, totalAmount, memberEmails } = req.body;
  const creator = req.user;

  if (!groupName || !totalAmount || isNaN(totalAmount) || totalAmount <= 0 || !memberEmails || !Array.isArray(memberEmails) || memberEmails.length === 0) {
    return res.status(400).json({ success: false, error: 'Group name, numeric total bill, and member emails array are required.' });
  }

  try {
    const groupId = 'GRP-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const allMembers = [creator.email.toLowerCase(), ...memberEmails.map(email => email.toLowerCase())];
    
    // Check if all members exist on AuraPay
    const allUsers = await db.find('users');
    const existingEmails = allUsers.map(u => u.email.toLowerCase());

    const missingEmails = memberEmails.filter(email => !existingEmails.includes(email.toLowerCase()));
    if (missingEmails.length > 0) {
      return res.status(400).json({ success: false, error: `Members not found on AuraPay: ${missingEmails.join(', ')}` });
    }

    // Calculate equal split share
    const shareCount = allMembers.length;
    const splitAmount = Math.round((totalAmount / shareCount) * 100) / 100;

    // Create splits list
    const splits = allMembers.map(email => ({
      email,
      amount: splitAmount,
      status: email === creator.email.toLowerCase() ? 'settled' : 'pending'
    }));

    const newGroup = await db.create('groups', {
      id: groupId,
      name: groupName,
      creatorEmail: creator.email,
      members: allMembers,
      totalAmount: Number(totalAmount),
      splits
    });

    // Automatically create payment request bubbles in members' chat threads!
    for (const email of memberEmails) {
      const msgId = 'REQ-SPL-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      await db.create('messages', {
        id: msgId,
        senderEmail: creator.email,
        receiverEmail: email.toLowerCase(),
        type: 'payment_request',
        amount: splitAmount,
        text: `Split request for group: ${groupName}`,
        status: 'pending'
      });
    }

    res.status(201).json({ success: true, group: newGroup });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Get My Split Groups
export const getMyGroups = async (req, res) => {
  const user = req.user;

  try {
    const allGroups = await db.find('groups');
    
    // Filter groups where user is a member
    const userGroups = allGroups.filter(g => g.members.includes(user.email.toLowerCase()));
    
    // Sort newest first
    const sortedGroups = [...userGroups].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, groups: sortedGroups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Settle a split in a group (Helper called when a split payment completes in chat)
export const updateGroupSplitStatus = async (senderEmail, receiverEmail, amount) => {
  try {
    const groups = await db.find('groups');
    
    // Search for groups containing sender and receiver, where status is pending and split amount matches
    for (const group of groups) {
      const isSenderMember = group.members.includes(senderEmail.toLowerCase());
      const isReceiverMember = group.members.includes(receiverEmail.toLowerCase());
      
      if (isSenderMember && isReceiverMember) {
        // Find split matching sender and status pending
        const userSplitIndex = group.splits.findIndex(s => 
          s.email.toLowerCase() === senderEmail.toLowerCase() && 
          s.status === 'pending' && 
          Math.abs(s.amount - amount) < 0.5
        );

        if (userSplitIndex !== -1) {
          const updatedSplits = [...group.splits];
          updatedSplits[userSplitIndex].status = 'settled';
          await db.update('groups', { id: group.id }, { splits: updatedSplits });
          console.log(`Updated group split status for ${senderEmail} in group ${group.name}`);
          break; // updated the most recent matching group split
        }
      }
    }
  } catch (error) {
    console.error('Error updating group split status:', error);
  }
};
