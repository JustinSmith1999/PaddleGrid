import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Search, MessageCircle, User, Image as ImageIcon, Video, X, Loader2, ArrowLeft, Plus, Users, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { moderateContent, moderateImageFile } from '../../lib/contentModeration';
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
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export default function Messages({ startWithUserId, sidebarCollapsed, onToggleSidebar }: MessagesProps = {}) {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

          setMessages((prev) => {
            if (prev.some(msg => msg.id === newMsg.id)) {
              return prev;
            }

            return prev;
          });

          if (newMsg.sender_id !== user?.id) {
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

            setMessages((prev) => {
              if (prev.some(msg => msg.id === newMsg.id)) {
                return prev;
              }
              return [...prev, enrichedMessage];
            });

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

    if (newMessage.trim()) {
      const moderationResult = moderateContent(newMessage);
      if (!moderationResult.isClean) {
        alert(moderationResult.reason || 'Your message contains inappropriate content');
        return;
      }
    }

    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const imageModerationResult = moderateImageFile(selectedFile);
      if (!imageModerationResult.isClean) {
        alert(imageModerationResult.reason || 'Your image contains inappropriate content');
        return;
      }
    }

    const messageContent = newMessage.trim();
    const fileToUpload = selectedFile;

    setNewMessage('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setSendingMessage(true);

    try {
      let mediaUrl = null;
      let mediaType = null;

      if (fileToUpload) {
        setUploadingMedia(true);
        mediaUrl = await uploadMedia(fileToUpload);

        if (!mediaUrl) {
          alert('Failed to upload media');
          return;
        }

        if (fileToUpload.type.startsWith('image/')) {
          mediaType = 'image';
        } else if (fileToUpload.type.startsWith('video/')) {
          mediaType = 'video';
        }
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, profile_picture_url')
        .eq('id', user.id)
        .single();

      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        sender_id: user.id,
        content: messageContent || null,
        media_url: mediaUrl,
        media_type: mediaType,
        created_at: new Date().toISOString(),
        sender_name: profile
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User'
          : 'User',
        sender_avatar: profile?.profile_picture_url || null
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: user.id,
          content: messageContent || null,
          media_url: mediaUrl,
          media_type: mediaType
        })
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) =>
        prev.map(msg =>
          msg.id === optimisticMessage.id
            ? { ...optimisticMessage, id: data.id }
            : msg
        )
      );

      setConversations((prev) =>
        prev.map(conv =>
          conv.id === selectedConversation
            ? {
                ...conv,
                last_message: messageContent || (mediaType === 'image' ? 'Sent a photo' : mediaType === 'video' ? 'Sent a video' : 'New message'),
                last_message_time: new Date().toISOString()
              }
            : conv
        ).sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime())
      );
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
      await fetchMessages(selectedConversation);
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
        <Loader2 className="w-7 h-7 text-green-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#F8F9FC]">
      {/* Conversation List */}
      <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-slate-200/60 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {/* List Header */}
        <div className="px-5 py-4 border-b border-slate-200/60">
          <div className="flex items-center gap-2 mb-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="hidden lg:flex p-2 hover:bg-slate-50 rounded-xl transition-colors"
                title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
              >
                <Menu className="w-5 h-5 text-slate-400" />
              </button>
            )}
            <h2 className="text-lg font-bold text-slate-800">Messages</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-white focus:border-green-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredConversations.map((conv, index) => (
                <motion.button
                  key={conv.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full px-4 py-3.5 flex items-center gap-3 hover:bg-slate-50/50 transition-all duration-200 ${
                    selectedConversation === conv.id ? 'bg-green-50/50 border-l-2 border-l-green-700' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center ring-2 ring-white shadow-sm overflow-hidden">
                      {conv.other_user_avatar ? (
                        <img
                          src={conv.other_user_avatar}
                          alt={conv.other_user_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 ring-2 ring-white rounded-full" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-semibold text-slate-800 flex-1 truncate text-sm">
                        {conv.other_user_name}
                      </span>
                      {conv.unread_count > 0 && (
                        <span className="bg-green-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 min-w-[20px] text-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                      {conv.last_message}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F8F9FC] border border-slate-200/60 flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-6 h-6 text-green-700" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No conversations yet</p>
              <p className="text-xs text-slate-400 mt-1">Start a conversation with someone</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
        {/* Chat Header */}
        {selectedConversation && (
          <div className="bg-white border-b border-slate-200/60 px-5 py-3.5 flex items-center gap-3">
            <button
              onClick={() => setSelectedConversation(null)}
              className="md:hidden p-2 -ml-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center ring-2 ring-white shadow-sm overflow-hidden">
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
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 ring-2 ring-white rounded-full" />
            </div>
            <div>
              <span className="font-semibold text-slate-800 block text-sm">
                {conversations.find(c => c.id === selectedConversation)?.other_user_name}
              </span>
              <span className="text-[10px] text-green-600 font-medium">Online</span>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F9FC]">
          {selectedConversation ? (
            messages.length > 0 ? (
              <>
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${msg.sender_id !== user?.id ? 'flex items-end gap-2' : ''}`}>
                        {msg.sender_id !== user?.id && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center flex-shrink-0 mb-5 ring-2 ring-white shadow-sm overflow-hidden">
                            {msg.sender_avatar ? (
                              <img src={msg.sender_avatar} alt={msg.sender_name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                        )}
                        <div>
                          <div
                            className={`overflow-hidden shadow-sm ${
                              msg.sender_id === user?.id
                                ? 'bg-green-700 text-white rounded-2xl rounded-br-md'
                                : 'bg-white text-slate-800 rounded-2xl rounded-bl-md border border-slate-200/60'
                            }`}
                          >
                            {msg.media_url && (
                              <div className="max-w-sm">
                                {msg.media_type === 'image' ? (
                                  <img src={msg.media_url} alt="Shared image" className="w-full h-auto rounded-t-2xl" />
                                ) : msg.media_type === 'video' ? (
                                  <video src={msg.media_url} controls className="w-full h-auto rounded-t-2xl" />
                                ) : null}
                              </div>
                            )}
                            {msg.content && (
                              <p className="text-sm px-4 py-2.5 leading-relaxed">{msg.content}</p>
                            )}
                          </div>
                          <p className={`text-[10px] text-slate-400 mt-1 font-medium ${
                            msg.sender_id === user?.id ? 'text-right' : ''
                          }`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-7 h-7 text-green-700" />
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">Start the conversation</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Send a message to begin chatting
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-9 h-9 text-green-700" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1.5">
                  Select a conversation
                </h3>
                <p className="text-sm text-slate-400">
                  Choose a conversation from the list to start chatting
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-slate-200/60 px-4 py-3">
          {previewUrl && (
            <div className="mb-3 relative inline-block">
              <div className="relative">
                {selectedFile?.type.startsWith('image/') ? (
                  <img src={previewUrl} alt="Preview" className="h-20 rounded-xl border border-slate-200/60" />
                ) : (
                  <video src={previewUrl} className="h-20 rounded-xl border border-slate-200/60" />
                )}
                <button
                  onClick={clearSelectedFile}
                  className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 hover:bg-slate-900 transition-colors shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
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
              className="p-2.5 text-slate-400 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="flex-1 px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-white focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              disabled={!selectedConversation || sendingMessage || uploadingMedia}
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              disabled={!selectedConversation || (!newMessage.trim() && !selectedFile) || sendingMessage || uploadingMedia}
              className="bg-green-700 hover:bg-green-800 text-white rounded-xl p-2.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {sendingMessage || uploadingMedia ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* New Message Modal */}
      <AnimatePresence>
        {showNewMessageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-slate-200/60 max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-green-700/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-green-700" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    Start New Conversation
                  </h3>
                </div>
                <button
                  onClick={() => setShowNewMessageModal(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(80vh-5rem)]">
                <UserSearch
                  onUserSelect={handleUserSelected}
                  excludeCurrentUser={true}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
