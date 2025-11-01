import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window');

// Online CDN Images for avatars and map
const CDN_IMAGES = {
  avatar: 'https://i.pravatar.cc/150?img=3',
  mapThumbnail: 'https://via.placeholder.com/50/4A90E2/FFFFFF?text=MAP',
  userAvatar: 'https://i.pravatar.cc/150?img=8',
};

const ChatScreen = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hi, be there in min!', type: 'sent', timestamp: new Date(), read: true },
    { id: 2, text: 'Ok, thanks!', type: 'received', timestamp: new Date(), read: true },
    { id: 3, text: 'Hi, be there in min!', type: 'sent', timestamp: new Date(), read: true },
    { id: 4, text: 'Just arrived.', type: 'sent', timestamp: new Date(), read: true },
    { id: 5, text: 'Coming now.', type: 'received', timestamp: new Date(), read: false },
    { id: 6, text: 'Coming now.', type: 'received', timestamp: new Date(), read: false },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const typingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate container on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Keyboard listeners
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      scrollToBottom();
    });
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  useEffect(() => {
    // Auto scroll to bottom when new message arrives
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Typing animation
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isTyping]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = () => {
    if (inputText.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: inputText.trim(),
        type: 'sent',
        timestamp: new Date(),
        read: false,
      };

      // Haptic feedback (if available)
      // You can add react-native-haptic-feedback for better experience

      // Animate send button
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      setMessages([...messages, newMessage]);
      setInputText('');
      
      // Simulate typing indicator
      setTimeout(() => {
        setIsTyping(true);
      }, 500);
      
      setTimeout(() => {
        setIsTyping(false);
        // Simulate received message
        const autoReply = {
          id: messages.length + 2,
          text: 'Thanks for your message!',
          type: 'received',
          timestamp: new Date(),
          read: false,
        };
        setMessages(prev => [...prev, autoReply]);
      }, 2500);
    }
  };

  const handleAttachment = () => {
    Alert.alert(
      'Attachment Options',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => console.log('Camera pressed') },
        { text: 'Gallery', onPress: () => console.log('Gallery pressed') },
        { text: 'Document', onPress: () => console.log('Document pressed') },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleCall = () => {
    Alert.alert('Calling', 'Calling Lialin...', [{ text: 'Cancel', style: 'cancel' }]);
  };

  const handleInfo = () => {
    Alert.alert('Trip Info', 'Trip ID: #A12C3B\nDriver: Lialin\nStatus: Active', [{ text: 'OK' }]);
  };

  const MessageBubble = ({ msg, index, isConsecutive }) => {
    const bubbleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.spring(bubbleAnim, {
        toValue: 1,
        delay: index * 50,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.messageBubble,
          msg.type === 'sent' ? styles.sentBubble : styles.receivedBubble,
          isConsecutive && styles.consecutiveMessage,
          {
            opacity: bubbleAnim,
            transform: [
              {
                translateY: bubbleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
              {
                scale: bubbleAnim,
              },
            ],
          },
        ]}
      >
        <Text style={msg.type === 'sent' ? styles.sentText : styles.receivedText}>
          {msg.text}
        </Text>
        {msg.type === 'sent' && (
          <Image 
            source={{ uri: CDN_IMAGES.userAvatar }} 
            style={styles.avatar}
          />
        )}
        {msg.type === 'received' && msg.read && (
          <Icon name="checkmark-done" size={16} color="#4A4A4A" style={styles.checkmark} />
        )}
      </Animated.View>
    );
  };

  const TypingIndicator = () => (
    <Animated.View 
      style={[
        styles.typingIndicator,
        {
          opacity: typingAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
          }),
        },
      ]}
    >
      <View style={[styles.typingDot, { backgroundColor: '#8E8E93' }]} />
      <View style={[styles.typingDot, { backgroundColor: '#8E8E93', marginLeft: 4 }]} />
      <View style={[styles.typingDot, { backgroundColor: '#8E8E93', marginLeft: 4 }]} />
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <Animated.View 
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                }
              ]}
            >
              <TouchableOpacity style={styles.backButton}>
                <Icon name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={styles.headerContent}>
                {imageLoading && (
                  <View style={[styles.mapThumbnail, styles.loadingPlaceholder]}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
                <Image 
                  source={{ uri: CDN_IMAGES.mapThumbnail }}
                  style={[styles.mapThumbnail, imageLoading && { position: 'absolute', opacity: 0 }]}
                  onLoadEnd={() => setImageLoading(false)}
                />
                <View style={styles.headerInfo}>
                  <Text style={styles.tripId}>Trip ID: #A12C3B</Text>
                  <Text style={styles.driverName}>Lialin</Text>
                </View>
              </View>
              
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerAction} onPress={handleCall}>
                  <Icon name="call" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerAction} onPress={handleInfo}>
                  <Icon name="information-circle-outline" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </Animated.View>
            
            {/* Chat Area */}
            <Animated.View 
              style={[
                styles.chatContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                }
              ]}
            >
              <ScrollView 
                ref={scrollViewRef}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                {messages.map((msg, index) => {
                  const isConsecutive = index < messages.length - 1 && messages[index + 1].type === msg.type;
                  return (
                    <MessageBubble 
                      key={msg.id} 
                      msg={msg} 
                      index={index}
                      isConsecutive={isConsecutive}
                    />
                  );
                })}
                
                {isTyping && <TypingIndicator />}
              </ScrollView>
              
              {/* Message Input */}
              <View style={styles.inputContainer}>
                <TouchableOpacity 
                  style={styles.attachButton}
                  activeOpacity={0.7}
                  onPress={handleAttachment}
                >
                  <FeatherIcon name="paperclip" size={22} color="#8E8E93" />
                </TouchableOpacity>
                
                <TextInput
                  style={styles.textInput}
                  placeholder="Message..."
                  placeholderTextColor="#8E8E93"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxHeight={100}
                  onSubmitEditing={sendMessage}
                  returnKeyType="send"
                  blurOnSubmit={false}
                />
                
                <TouchableOpacity 
                  style={[
                    styles.sendButton,
                    inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
                  ]}
                  onPress={sendMessage}
                  disabled={!inputText.trim()}
                  activeOpacity={0.7}
                >
                  <Animated.View
                    style={{
                      transform: [
                        {
                          scale: inputText.trim() ? 1 : 0.8,
                        },
                      ],
                    }}
                  >
                    <Icon 
                      name="send" 
                      size={18} 
                      color="#FFFFFF" 
                      style={{ transform: [{ translateX: -2 }, { translateY: -1 }] }}
                    />
                  </Animated.View>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#2C2C2E',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerAction: {
    padding: 5,
    marginLeft: 10,
  },
  mapThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#3A3A3C',
  },
  loadingPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  tripId: {
    color: '#E5E5EA',
    fontSize: 16,
    fontWeight: 'bold',
  },
  driverName: {
    color: '#AEAEB2',
    fontSize: 14,
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 10,
    overflow: 'hidden',
  },
  messageList: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    flexGrow: 1,
  },
  messageBubble: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: '75%',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  consecutiveMessage: {
    marginBottom: 4,
  },
  sentBubble: {
    backgroundColor: '#0B64E4',
    alignSelf: 'flex-end',
  },
  receivedBubble: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
  },
  sentText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
  },
  receivedText: {
    color: '#000000',
    fontSize: 16,
    lineHeight: 20,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  checkmark: {
    marginLeft: 8,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: '#E5E5EA',
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#F2F2F7',
    minHeight: 60,
  },
  attachButton: {
    padding: 5,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 16,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minHeight: 40,
    maxHeight: 100,
  },
  sendButton: {
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#0B64E4',
  },
  sendButtonInactive: {
    backgroundColor: '#C7C7CC',
  },
});

export default ChatScreen;