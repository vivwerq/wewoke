import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();
// supabase is provided by ../lib/supabase and may be a stub in local dev

// Create report
router.post('/', async (req, res) => {
  try {
    const { reporterId, reportedUserId, category, description, callId } = req.body;
    
    if (!reporterId || !reportedUserId || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        category,
        description,
        call_id: callId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ report: data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get reports (moderators/admins only)
router.get('/', async (req, res) => {
  try {
    const { resolved } = req.query;
    
    let query = supabase
      .from('reports')
      .select(`
        *,
        reporter:reporter_id(id, username),
        reported_user:reported_user_id(id, username, avatar_url)
      `)
      .order('created_at', { ascending: false });
    
    if (resolved !== undefined) {
      query = query.eq('resolved', resolved === 'true');
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json({ reports: data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get report by ID
router.get('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:reporter_id(id, username),
        reported_user:reported_user_id(id, username, avatar_url, bio)
      `)
      .eq('id', reportId)
      .single();
    
    if (error) throw error;
    
    res.json({ report: data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Resolve report
router.post('/:reportId/resolve', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { resolvedBy } = req.body;
    
    const { data, error } = await supabase
      .from('reports')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy
      })
      .eq('id', reportId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ report: data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get reports for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('reported_user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ reports: data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
