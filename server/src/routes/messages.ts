import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();
// supabase is provided by ../lib/supabase and may be a stub in local dev

// Get messages between two users
router.get('/:userId/:friendId', async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    
    // Verify friendship exists
    const { data: friendship } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${userId})`)
      .eq('status', 'accepted')
      .single();
    
    if (!friendship) {
      return res.status(403).json({ error: 'Not friends with this user' });
    }
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    res.json({ messages: data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Send message
router.post('/', async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    
    // Verify friendship
    const { data: friendship } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${senderId},addressee_id.eq.${receiverId}),and(requester_id.eq.${receiverId},addressee_id.eq.${senderId})`)
      .eq('status', 'accepted')
      .single();
    
    if (!friendship) {
      return res.status(403).json({ error: 'Can only message friends' });
    }
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ message: data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Mark messages as read
router.post('/read', async (req, res) => {
  try {
    const { userId, senderId } = req.body;
    
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', userId)
      .eq('sender_id', senderId)
      .eq('is_read', false);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get unread message count
router.get('/:userId/unread', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
    
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
