import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Phone, Info } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
import { useAppTheme } from '../helpers/use-app-theme';

const CHAT_STORAGE_PREFIX = 'chat_history_';
const CHAT_THREADS_KEY = 'chat_threads';
const seededMessages = [
  { id: 1, text: 'Hi, I’ll be there in 5 minutes!', type: 'sent', timestamp: new Date().toISOString() },
  { id: 2, text: 'Okay, thanks!', type: 'received', timestamp: new Date().toISOString() },
  { id: 3, text: 'Just arrived at the pickup point.', type: 'sent', timestamp: new Date().toISOString() },
];

function buildMessageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseStoredList(value, fallback) {
  if (!value) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

function MessageBubble({ message, styles }) {
  const isSent = message.type === 'sent';

  return (
    <View style={[styles.messageContainer, isSent && styles.sentContainer]}>
      <View style={[styles.messageBubble, isSent && styles.sentBubble]}>
        <Text style={[styles.messageText, isSent && styles.sentText]}>{message.text}</Text>
      </View>
    </View>
  );
}

function ChatScreenNew({ navigation, route }) {
  const { matchId, contact } = route.params || {};
  const { colors, statusBarStyle } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(function () {
    return getStyles(colors);
  }, [colors]);
  const [messages, setMessages] = useState(seededMessages);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef(null);

  const keyboardVerticalOffset = Platform.OS === 'ios' ? (insets.top || 0) + 72 : 0;

  const otherUser = {
    name: contact?.name || 'Support',
    rating: contact?.rating || 5,
    route: contact?.route || '',
    time: contact?.time || '',
    fare: contact?.fare,
  };

  useEffect(() => {
    let mounted = true;
    async function loadHistory() {
      if (!matchId) {
        return;
      }
      try {
        const stored = await AsyncStorage.getItem(`${CHAT_STORAGE_PREFIX}${matchId}`);
        const parsed = parseStoredList(stored, seededMessages);
        if (mounted) {
          setMessages(parsed);
        }
        await AsyncStorage.setItem(`${CHAT_STORAGE_PREFIX}${matchId}`, JSON.stringify(parsed));
        await persistThreadSnapshot(parsed);
      } catch (error) {
        console.log('Failed to load chat history', error);
      }
    }
    loadHistory();
    return () => {
      mounted = false;
    };
  }, [matchId]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  async function persistMessages(nextMessages) {
    if (!matchId) {
      return;
    }
    try {
      const normalized = Array.isArray(nextMessages) ? nextMessages : [];
      await AsyncStorage.setItem(`${CHAT_STORAGE_PREFIX}${matchId}`, JSON.stringify(normalized));
      await persistThreadSnapshot(normalized);
    } catch (error) {
      console.log('Failed to persist chat history', error);
    }
  }

  async function persistThreadSnapshot(latestMessages) {
    if (!matchId) {
      return;
    }
    const base = Array.isArray(latestMessages) ? latestMessages : [];
    const last = base.length > 0 ? base[base.length - 1] : null;
    const snapshot = {
      matchId,
      contact: {
        name: otherUser.name,
        rating: otherUser.rating,
        route: otherUser.route,
        time: otherUser.time,
        fare: otherUser.fare,
      },
      lastMessage: last?.text ?? '',
      updatedAt: last?.timestamp ?? new Date().toISOString(),
    };
    try {
      const stored = await AsyncStorage.getItem(CHAT_THREADS_KEY);
      const threads = parseStoredList(stored, []);
      const index = threads.findIndex((thread) => thread.matchId === matchId);
      if (index >= 0) {
        threads[index] = { ...threads[index], ...snapshot };
      } else {
        threads.push(snapshot);
      }
      threads.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      await AsyncStorage.setItem(CHAT_THREADS_KEY, JSON.stringify(threads));
    } catch (error) {
      console.log('Failed to persist chat thread', error);
    }
  }

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage = {
        id: buildMessageId(),
        text: inputText.trim(),
        type: 'sent',
        timestamp: new Date().toISOString(),
      };
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      persistMessages(updatedMessages);
      setInputText('');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName}>{otherUser.name}</Text>
          <Text style={styles.headerRating}>{otherUser.rating}★</Text>
          {!!otherUser.route && (
            <Text style={styles.headerMeta}>
              {otherUser.route}
              {otherUser.time ? ` • ${otherUser.time}` : ''}
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Phone size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Info size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} styles={styles} />
          ))}
        </ScrollView>

        {/* Input Area - Thumb Zone */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(SPACING.sm, insets.bottom) }]}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={colors.text.tertiary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() && styles.sendButtonActive]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Send
              size={20}
              color={inputText.trim() ? colors.button.primaryText : colors.text.tertiary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerCenter: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  headerName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerRating: {
    ...TYPOGRAPHY.caption,
    color: colors.text.secondary,
    marginTop: SPACING.xs,
  },
  headerMeta: {
    ...TYPOGRAPHY.caption,
    color: colors.text.tertiary,
    marginTop: SPACING.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerButton: {
    padding: SPACING.xs,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.md,
  },
  messageContainer: {
    marginBottom: SPACING.sm,
    maxWidth: '75%',
  },
  sentContainer: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    padding: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: RADIUS.md,
    backgroundColor: colors.bg.elevated,
  },
  sentBubble: {
    backgroundColor: colors.button.primaryBg,
    borderColor: colors.button.primaryBg,
  },
  messageText: {
    ...TYPOGRAPHY.body,
    color: colors.text.primary,
  },
  sentText: {
    color: colors.button.primaryText,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.bg.primary,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: colors.text.primary,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.button.primaryBg,
    borderColor: colors.button.primaryBg,
  },
  });
}

export default ChatScreenNew;
