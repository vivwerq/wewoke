const API_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Friends API
export const friendsAPI = {
  async getFriends(userId: string) {
    const response = await fetch(`${API_URL}/api/friends/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch friends');
    return response.json();
  },
  
  async sendFriendRequest(requesterId: string, addresseeId: string) {
    const response = await fetch(`${API_URL}/api/friends/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId, addresseeId })
    });
    if (!response.ok) throw new Error('Failed to send friend request');
    return response.json();
  },
  
  async acceptFriendRequest(friendshipId: string, userId: string) {
    const response = await fetch(`${API_URL}/api/friends/accept/${friendshipId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (!response.ok) throw new Error('Failed to accept friend request');
    return response.json();
  },
  
  async rejectFriendRequest(friendshipId: string, userId: string) {
    const response = await fetch(`${API_URL}/api/friends/reject/${friendshipId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (!response.ok) throw new Error('Failed to reject friend request');
    return response.json();
  },
  
  async removeFriend(friendshipId: string) {
    const response = await fetch(`${API_URL}/api/friends/${friendshipId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to remove friend');
    return response.json();
  },
  
  async getPendingRequests(userId: string) {
    const response = await fetch(`${API_URL}/api/friends/${userId}/pending`);
    if (!response.ok) throw new Error('Failed to fetch pending requests');
    return response.json();
  }
};

// Messages API
export const messagesAPI = {
  async getMessages(userId: string, friendId: string) {
    const response = await fetch(`${API_URL}/api/messages/${userId}/${friendId}`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },
  
  async sendMessage(senderId: string, receiverId: string, content: string) {
    const response = await fetch(`${API_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId, receiverId, content })
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },
  
  async markAsRead(userId: string, senderId: string) {
    const response = await fetch(`${API_URL}/api/messages/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, senderId })
    });
    if (!response.ok) throw new Error('Failed to mark messages as read');
    return response.json();
  },
  
  async getUnreadCount(userId: string) {
    const response = await fetch(`${API_URL}/api/messages/${userId}/unread`);
    if (!response.ok) throw new Error('Failed to fetch unread count');
    return response.json();
  }
};

// Reports API
export const reportsAPI = {
  async createReport(
    reporterId: string,
    reportedUserId: string,
    category: string,
    description?: string,
    callId?: string
  ) {
    const response = await fetch(`${API_URL}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reporterId,
        reportedUserId,
        category,
        description,
        callId
      })
    });
    if (!response.ok) throw new Error('Failed to create report');
    return response.json();
  },
  
  async getReports(resolved?: boolean) {
    const url = resolved !== undefined
      ? `${API_URL}/api/reports?resolved=${resolved}`
      : `${API_URL}/api/reports`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch reports');
    return response.json();
  },
  
  async getReport(reportId: string) {
    const response = await fetch(`${API_URL}/api/reports/${reportId}`);
    if (!response.ok) throw new Error('Failed to fetch report');
    return response.json();
  },
  
  async resolveReport(reportId: string, resolvedBy: string) {
    const response = await fetch(`${API_URL}/api/reports/${reportId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolvedBy })
    });
    if (!response.ok) throw new Error('Failed to resolve report');
    return response.json();
  },
  
  async getUserReports(userId: string) {
    const response = await fetch(`${API_URL}/api/reports/user/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user reports');
    return response.json();
  }
};
