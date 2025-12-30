import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://finia.seguricloud.com/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  '¿Cómo puedo ahorrar más dinero?',
  '¿En qué estoy gastando más?',
  '¿Cómo salir de deudas?',
  '¿Cómo crear un presupuesto?',
  '¿Dónde debería invertir?',
  '¿Cómo crear un fondo de emergencia?',
];

export default function AIAssistantScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! Soy tu asistente financiero de FINIA. ¿En qué puedo ayudarte hoy?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (messages.length > 1) {
      setShowSuggestions(false);
    }
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageToSend = text || inputText;
    if (!messageToSend.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageToSend,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    setShowSuggestions(false);

    try {
      const response = await axios.post(`${API_URL}/ai/chat`, {
        userId: user?.id,
        message: messageToSend,
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.response || 'Lo siento, no pude procesar tu solicitud.',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, hubo un error al conectar con el servidor. Por favor verifica que el backend esté funcionando.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <Text style={styles.title}>Asistente IA</Text>
          {!user?.isPremium && (
            <TouchableOpacity
              style={styles.premiumBadge}
              onPress={() => router.push('/(tabs)/upgrade')}
            >
              <Text style={styles.premiumText}>⭐ Premium</Text>
            </TouchableOpacity>
          )}
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.chatContainer}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Text style={[styles.messageText, message.isUser ? styles.userText : styles.aiText]}>
                  {message.text}
                </Text>
                <Text style={styles.timestamp}>
                  {message.timestamp.toLocaleTimeString('es-PE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))}
            {loading && (
              <View style={styles.loadingBubble}>
                <ActivityIndicator color="#00D4AA" />
                <Text style={styles.loadingText}>Pensando...</Text>
              </View>
            )}

            {showSuggestions && messages.length === 1 && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>💡 Preguntas sugeridas:</Text>
                {SUGGESTED_QUESTIONS.map((question, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionButton}
                    onPress={() => handleSuggestionPress(question)}
                  >
                    <Text style={styles.suggestionText}>{question}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Escribe tu mensaje..."
              placeholderTextColor="#6B7280"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage()}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || loading}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  wrapper: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  premiumBadge: { backgroundColor: '#FFD700', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  premiumText: { fontSize: 12, fontWeight: 'bold', color: '#0A0E27' },
  chatContainer: { flex: 1 },
  messagesContainer: { flex: 1 },
  messagesContent: { 
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  messageBubble: { maxWidth: '80%', borderRadius: 16, padding: 12, marginBottom: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#00D4AA' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#151B3D' },
  messageText: { fontSize: 15, lineHeight: 20, marginBottom: 4 },
  userText: { color: '#0A0E27' },
  aiText: { color: '#FFFFFF' },
  timestamp: { fontSize: 10, color: '#9CA3AF', alignSelf: 'flex-end' },
  loadingBubble: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#151B3D', borderRadius: 16, padding: 12, marginBottom: 12 },
  loadingText: { fontSize: 14, color: '#9CA3AF', marginLeft: 8 },
  suggestionsContainer: { marginTop: 8, marginBottom: 16 },
  suggestionsTitle: { fontSize: 14, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 12 },
  suggestionButton: { backgroundColor: '#151B3D', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#2D3748' },
  suggestionText: { fontSize: 14, color: '#FFFFFF' },
  inputContainer: { 
    flexDirection: 'row', 
    padding: 12,
    paddingBottom: 0,
    backgroundColor: '#0A0E27',
    borderTopWidth: 1,
    borderTopColor: '#1E2749',
  },
  input: {
    flex: 1,
    backgroundColor: '#151B3D',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
    maxHeight: 100,
    borderWidth: 2,
    borderColor: '#2D3748',
    marginRight: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00D4AA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendIcon: { fontSize: 20, color: '#0A0E27' },
});
