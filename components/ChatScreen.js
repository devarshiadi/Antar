import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import {
  ArrowLeft,
  Phone,
  Info,
  Paperclip,
  Send,
  Check,
  CheckCheck,
  User,
  MapPin,
  MoreVertical,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);
  
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const typingAnim = useRef(new Animated.Value(0)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const typingAnimationRef = useRef(null);

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
      setTimeout(() => scrollToBottom(), 100);
    });
    
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
      if (typingAnimationRef.current) {
        typingAnimationRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    // Auto scroll to bottom when new message arrives
    setTimeout(() => scrollToBottom(), 100);
  }, [messages]);

  useEffect(() => {
    // Typing animation
    if (isTyping) {
      typingAnimationRef.current = Animated.loop(
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
      );
      typingAnimationRef.current.start();
    } else {
      if (typingAnimationRef.current) {
        typingAnimationRef.current.stop();
        typingAnim.setValue(0);
      }
    }

    return () => {
      if (typingAnimationRef.current) {
        typingAnimationRef.current.stop();
      }
    };
  }, [isTyping]);

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
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

      // Animate send button
      Animated.sequence([
        Animated.timing(sendButtonScale, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(sendButtonScale, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      setMessages([...messages, newMessage]);
      setInputText('');
      setInputHeight(40);
      
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

  const handleContentSizeChange = (event) => {
    const newHeight = Math.min(100, Math.max(40, event.nativeEvent.contentSize.height));
    setInputHeight(newHeight);
  };

  const MessageBubble = ({ msg, index, isConsecutive }) => {
    const bubbleAnim = useRef(new Animated.Value(0)).current;
    const bubbleScale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(bubbleAnim, {
          toValue: 1,
          delay: index * 30,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(bubbleScale, {
          toValue: 1,
          delay: index * 30,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.messageRow,
          msg.type === 'sent' && styles.sentRow,
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
                scale: bubbleScale,
              },
            ],
          },
        ]}
      >
        {msg.type === 'received' && !isConsecutive && (
          <View style={styles.avatarContainer}>
            <User size={16} color="#FFFFFF" />
          </View>
        )}
        
        <View
          style={[
            styles.messageBubble,
            msg.type === 'sent' ? styles.sentBubble : styles.receivedBubble,
            isConsecutive && styles.consecutiveMessage,
            msg.type === 'received' && isConsecutive && styles.consecutiveReceivedMargin,
          ]}
        >
          <Text style={msg.type === 'sent' ? styles.sentText : styles.receivedText}>
            {msg.text}
          </Text>
          
          {msg.type === 'sent' && (
            <View style={styles.messageStatus}>
              {msg.read ? (
                <CheckCheck size={14} color="#FFFFFF" style={styles.checkmark} />
              ) : (
                <Check size={14} color="#FFFFFF" style={styles.checkmark} />
              )}
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const TypingIndicator = () => (
    <Animated.View 
      style={[
        styles.typingContainer,
        {
          opacity: typingAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          }),
        },
      ]}
    >
      <View style={styles.avatarContainer}>
        <User size={16} color="#FFFFFF" />
      </View>
      <View style={styles.typingIndicator}>
        <View style={[styles.typingDot, { backgroundColor: '#8E8E93' }]} />
        <View style={[styles.typingDot, { backgroundColor: '#8E8E93', marginLeft: 4 }]} />
        <View style={[styles.typingDot, { backgroundColor: '#8E8E93', marginLeft: 4 }]} />
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
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
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.mapIconContainer}>
              <MapPin size={24} color="#FFFFFF" />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.tripId}>Trip ID: #A12C3B</Text>
              <Text style={styles.driverName}>Lialin</Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerAction} onPress={handleCall} activeOpacity={0.7}>
              <Phone size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAction} onPress={handleInfo} activeOpacity={0.7}>
              <Info size={22} color="#FFFFFF" />
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
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView 
              ref={scrollViewRef}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              bounces={true}
            >
              {messages.map((msg, index) => {
                const isConsecutive = index > 0 && messages[index - 1].type === msg.type;
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
          </TouchableWithoutFeedback>
          
          {/* Message Input */}
          <View style={[styles.inputContainer, keyboardVisible && styles.inputContainerKeyboard]}>
            <TouchableOpacity 
              style={styles.attachButton}
              activeOpacity={0.7}
              onPress={handleAttachment}
            >
              <Paperclip size={22} color="#8E8E93" />
            </TouchableOpacity>
            
            <TextInput
              style={[styles.textInput, { height: Math.max(40, inputHeight) }]}
              placeholder="Message..."
              placeholderTextColor="#8E8E93"
              value={inputText}
              onChangeText={setInputText}
              multiline
              onContentSizeChange={handleContentSizeChange}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              blurOnSubmit={false}
              textAlignVertical="center"
            />
            
            <Animated.View
              style={{
                transform: [{ scale: sendButtonScale }],
              }}
            >
              <TouchableOpacity 
                style={[
                  styles.sendButton,
                  inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim()}
                activeOpacity={0.7}
              >
                <Send 
                  size={18} 
                  color="#FFFFFF" 
                  style={{ transform: [{ translateX: -1 }] }}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
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
  mapIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#4A90E2',
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
  messageRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-end',
  },
  sentRow: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
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
  consecutiveReceivedMargin: {
    marginLeft: 36,
  },
  sentBubble: {
    backgroundColor: '#0B64E4',
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
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
  messageStatus: {
    marginLeft: 8,
  },
  checkmark: {
    opacity: 0.8,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: '#E5E5EA',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#F2F2F7',
    minHeight: 60,
  },
  inputContainerKeyboard: {
    paddingBottom: Platform.OS === 'ios' ? 10 : 10,
  },
  attachButton: {
    padding: 5,
    marginBottom: Platform.OS === 'ios' ? 5 : 7,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 16,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minHeight: 40,
    maxHeight: 100,
    color: '#000000',
  },
  sendButton: {
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 2 : 4,
  },
  sendButtonActive: {
    backgroundColor: '#0B64E4',
  },
  sendButtonInactive: {
    backgroundColor: '#C7C7CC',
  },
});

export default ChatScreen;
