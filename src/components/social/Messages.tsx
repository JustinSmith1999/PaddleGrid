import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Search, MessageCircle, User, Image as ImageIcon, Video, X, Loader2, ArrowLeft, Plus, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import UserSearch from './UserSearch';

interface Conversation {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message: string | null;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
}

interface MessagesProps {
  startWithUserId?: string;
}

export default function Messages({ startWithUserId }: MessagesProps = {}) {
  const { user } = useAuth();
  let searchParams: URLSearchParams | null = null;
  let setSearchParams: ((params: URLSearchParams) => void) | null = null;

  try {
    const result = useSearchParams();
    searchParams = result[0];
    setSearchParams = result[1];
  } catch (error) {
    console.log('useSearchParams not available - using props instead');
  }
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      markMessagesAsRead(selectedConversation);
      const subscription = subscribeToMessages(selectedConversation);
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    const userId = searchParams?.get('user') || startWithUserId;
    if (userId && user) {
      startConversationWithUser(userId);
    }
  }, [searchParams, startWithUserId, user]);

  const handleUserSelected = async (userId: string) => {
    setShowNewMessageModal(false);
    await startConversationWithUser(userId);
  };

  async function startConversationWithUser(otherUserId: string) {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: user.id,
        user2_id: otherUserId
      });

      if (error) throw error;

      setSelectedConversation(data);
      await fetchConversations();
      setSearchParams({});
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  }

  async function fetchConversations() {
    if (!user) return;

    setLoading(true);
    try {
      const { data: conversationsData, error } = await supabase
        .from('direct_conversations')
        .select(`
          id,
          participant_1_id,
          participant_2_id,
          last_message_at
        `)
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const enrichedConversations = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const otherUserId = conv.participant_1_id === user.id
            ? conv.participant_2_id
            : conv.participant_1_id;

          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, profile_picture_url')
            .eq('id', otherUserId)
            .single();

          const { data: lastMessage } = await supabase
            .from('direct_messages')
            .select('content, media_type')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count: unreadCount } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          let lastMessageText = 'Start a conversation...';
          if (lastMessage) {
            if (lastMessage.media_type === 'image') {
              lastMessageText = 'Sent a photo';
            } else if (lastMessage.media_type === 'video') {
              lastMessageText = 'Sent a video';
            } else if (lastMessage.content) {
              lastMessageText = lastMessage.content;
            }
          }

          return {
            id: conv.id,
            other_user_id: otherUserId,
            other_user_name: profile
              ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User'
              : 'User',
            other_user_avatar: profile?.profile_picture_url || null,
            last_message: lastMessageText,
            last_message_time: conv.last_message_at,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(enrichedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(conversationId: string) {
    try {
      const { data: messagesData, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const enrichedMessages = await Promise.all(
        (messagesData || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, profile_picture_url')
            .eq('id', msg.sender_id)
            .single();

          return {
            id: msg.id,
            sender_id: msg.sender_id,
            content: msg.content,
            media_url: msg.media_url,
            media_type: msg.media_type,
            created_at: msg.created_at,
            sender_name: profile
              ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User'
              : 'User',
            sender_avatar: profile?.profile_picture_url || null
          };
        })
      );

      setMessages(enrichedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }

  async function markMessagesAsRead(conversationId: string) {
    if (!user) return;

    try {
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  function subscribeToMessages(conversationId: string) {
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const newMsg = payload.new as any;

          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, profile_picture_url')
            .eq('id', newMsg.sender_id)
            .single();

          const enrichedMessage: Message = {
            id: newMsg.id,
            sender_id: newMsg.sender_id,
            content: newMsg.content,
            media_url: newMsg.media_url,
            media_type: newMsg.media_type,
            created_at: newMsg.created_at,
            sender_name: profile
              ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User'
              : 'User',
            sender_avatar: profile?.profile_picture_url || null
          };

          setMessages((prev) => [...prev, enrichedMessage]);

          if (newMsg.sender_id !== user?.id) {
            markMessagesAsRead(conversationId);
          }
        }
      )
      .subscribe();

    return subscription;
  }

  async function uploadMedia(file: File): Promise<string | null> {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('direct-messages')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('direct-messages')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      return null;
    }
  }

  async function sendMessage() {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation || !user) return;

    setSendingMessage(true);

    try {
      let mediaUrl = null;
      let mediaType = null;

      if (selectedFile) {
        setUploadingMedia(true);
        mediaUrl = await uploadMedia(selectedFile);

        if (!mediaUrl) {
          alert('Failed to upload media');
          return;
        }

        if (selectedFile.type.startsWith('image/')) {
          mediaType = 'image';
        } else if (selectedFile.type.startsWith('video/')) {
          mediaType = 'video';
        }
      }

      const { error } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: user.id,
          content: newMessage.trim() || null,
          media_url: mediaUrl,
          media_type: mediaType
        });

      if (error) throw error;

      setNewMessage('');
      setSelectedFile(null);
      setPreviewUrl(null);
      await fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
      setUploadingMedia(false);
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Please select an image or video file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function clearSelectedFile() {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.other_user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-white dark:bg-slate-900">
      <div className={`w-full md:w-1/3 border-r border-slate-200 dark:border-slate-800 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 ${
                  selectedConversation === conv.id ? 'bg-slate-100 dark:bg-slate-800' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                  {conv.other_user_avatar ? (
                    <img
                      src={conv.other_user_avatar}
                      alt={conv.other_user_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-slate-900 dark:text-white flex-1">
                      {conv.other_user_name}
                    </span>
                    {conv.unread_count > 0 && (
                      <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {conv.last_message}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-600 dark:text-slate-400">No conversations yet</p>
            </div>
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
        {selectedConversation && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <button
              onClick={() => setSelectedConversation(null)}
              className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              {conversations.find(c => c.id === selectedConversation)?.other_user_avatar ? (
                <img
                  src={conversations.find(c => c.id === selectedConversation)?.other_user_avatar || ''}
                  alt="User"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">
              {conversations.find(c => c.id === selectedConversation)?.other_user_name}
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedConversation ? (
            messages.length > 0 ? (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${msg.sender_id === user?.id ? '' : 'flex items-start gap-2'}`}>
                    {msg.sender_id !== user?.id && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                        {msg.sender_avatar ? (
                          <img src={msg.sender_avatar} alt={msg.sender_name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-white" />
                        )}
                      </div>
                    )}
                    <div>
                      <div
                        className={`rounded-2xl overflow-hidden ${
                          msg.sender_id === user?.id
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        }`}
                      >
                        {msg.media_url && (
                          <div className="max-w-sm">
                            {msg.media_type === 'image' ? (
                              <img src={msg.media_url} alt="Shared image" className="w-full h-auto" />
                            ) : msg.media_type === 'video' ? (
                              <video src={msg.media_url} controls className="w-full h-auto" />
                            ) : null}
                          </div>
                        )}
                        {msg.content && (
                          <p className="text-sm px-4 py-2">{msg.content}</p>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${
                        msg.sender_id === user?.id ? 'text-right text-slate-500' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">Start the conversation</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                    Send a message to begin chatting
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="w-20 h-20 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Select a conversation
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Choose a conversation from the list to start chatting
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          {previewUrl && (
            <div className="mb-3 relative inline-block">
              <div className="relative">
                {selectedFile?.type.startsWith('image/') ? (
                  <img src={previewUrl} alt="Preview" className="h-20 rounded-lg" />
                ) : (
                  <video src={previewUrl} className="h-20 rounded-lg" />
                )}
                <button
                  onClick={clearSelectedFile}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedConversation}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach image or video"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input
              type="text"
              placeholder={selectedConversation ? "Type a message..." : "Select a conversation to start messaging"}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !sendingMessage && selectedConversation && sendMessage()}
              className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedConversation || sendingMessage || uploadingMedia}
            />
            <button
              onClick={sendMessage}
              disabled={!selectedConversation || (!newMessage.trim() && !selectedFile) || sendingMessage || uploadingMedia}
              className="p-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingMessage || uploadingMedia ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Start New Conversation
                </h3>
              </div>
              <button
                onClick={() => setShowNewMessageModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-5rem)]">
              <UserSearch
                onUserSelect={handleUserSelected}
                excludeCurrentUser={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
