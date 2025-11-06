import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();
// supabase is provided by ../lib/supabase and may be a stub in local dev

// Get user's friends
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        requester:requester_id(id, username, avatar_url),
        addressee:addressee_id(id, username, avatar_url)
      `)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted');
    
    if (error) throw error;
    
    res.json({ friends: data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Send friend request
router.post('/request', async (req, res) => {
  try {
    const { requesterId, addresseeId } = req.body;
    
    // Check if already friends or pending
    const { data: existing } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${requesterId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${requesterId})`);
    
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Friendship already exists or pending' });
    }
    
    const { data, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ friendship: data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Accept friend request
router.post('/accept/:friendshipId', async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const { userId } = req.body;
    
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
      .eq('addressee_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ friendship: data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Reject friend request
router.post('/reject/:friendshipId', async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const { userId } = req.body;
    
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'rejected' })
      .eq('id', friendshipId)
      .eq('addressee_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ friendship: data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Remove friend
router.delete('/:friendshipId', async (req, res) => {
  try {
    const { friendshipId } = req.params;
    
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get pending friend requests
router.get('/:userId/pending', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        requester:requester_id(id, username, avatar_url)
      `)
      .eq('addressee_id', userId)
      .eq('status', 'pending');
    
    if (error) throw error;
    
    res.json({ requests: data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
