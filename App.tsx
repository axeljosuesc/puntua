
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from './src/screens/OnboardingScreen';

type GuestRoutes = { Login: undefined; Register: undefined; Forgot: undefined };
type UserRoutes = { Home: undefined; Profile: undefined };
type ResetRoutes = { Reset: undefined };
const GuestStack = createNativeStackNavigator<GuestRoutes>();
const UserStack = createNativeStackNavigator<UserRoutes>();
const ResetStack = createNativeStackNavigator<ResetRoutes>();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showError(error: unknown) {
  Alert.alert('No se pudo completar', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
}

function Layout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Text style={styles.brand}>PUNTUA</Text>
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
function Field(props: { label: string; value: string; setValue: (v: string) => void; password?: boolean; email?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{props.label}</Text>
    <TextInput style={styles.input} placeholder={props.label} placeholderTextColor="#8291AA"
      value={props.value} onChangeText={props.setValue} secureTextEntry={props.password}
      autoCapitalize="none" autoCorrect={false}
      keyboardType={props.email ? 'email-address' : 'default'}
      autoComplete={props.email ? 'email' : props.password ? 'password' : 'off'} />
  </View>;
}
function Action({ label, onPress, busy = false, secondary = false }: { label: string; onPress: () => void; busy?: boolean; secondary?: boolean }) {
  return <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={onPress}
    style={[styles.button, secondary && styles.secondaryButton, busy && { opacity: 0.65 }]}>
    {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>{label}</Text>}
  </TouchableOpacity>;
}
function LinkText({ label, onPress }: { label: string; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} accessibilityRole="button"><Text style={styles.link}>{label}</Text></TouchableOpacity>;
}

function Login({ navigation }: NativeStackScreenProps<GuestRoutes, 'Login'>) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false);
  async function submit() {
    if (!emailPattern.test(email.trim()) || !password) return Alert.alert('Datos incompletos', 'Escribe un correo válido y tu contraseña.');
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw error;
    } catch (e) { showError(e); } finally { setBusy(false); }
  }
  return <Layout title="Iniciar sesión" subtitle="Tu preparación universitaria comienza aquí.">
    <Field label="Correo electrónico" value={email} setValue={setEmail} email />
    <Field label="Contraseña" value={password} setValue={setPassword} password />
    <Action label="Entrar" onPress={submit} busy={busy} />
    <LinkText label="¿Olvidaste tu contraseña?" onPress={() => navigation.navigate('Forgot')} />
    <LinkText label="¿No tienes cuenta? Regístrate" onPress={() => navigation.navigate('Register')} />
  </Layout>;
}
function Register({ navigation }: NativeStackScreenProps<GuestRoutes, 'Register'>) {
  const [name, setName] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [repeat, setRepeat] = useState(''); const [busy, setBusy] = useState(false);
  async function submit() {
    if (name.trim().length < 2 || !emailPattern.test(email.trim())) return Alert.alert('Revisa los datos', 'Escribe tu nombre y un correo válido.');
    if (password.length < 8) return Alert.alert('Contraseña', 'Utiliza al menos 8 caracteres.');
    if (password !== repeat) return Alert.alert('Contraseñas', 'Las contraseñas no coinciden.');
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(), password,
        options: { data: { full_name: name.trim() } },
      });
      if (error) throw error;
      Alert.alert('Registro enviado', data.session
        ? 'Tu cuenta está activa.'
        : 'Revisa tu correo y confirma tu dirección. Después inicia sesión.');
      if (!data.session) navigation.navigate('Login');
    } catch (e) { showError(e); } finally { setBusy(false); }
  }
  return <Layout title="Crear cuenta" subtitle="Registra tus datos para comenzar.">
    <Field label="Nombre completo" value={name} setValue={setName} />
    <Field label="Correo electrónico" value={email} setValue={setEmail} email />
    <Field label="Contraseña (mínimo 8 caracteres)" value={password} setValue={setPassword} password />
    <Field label="Repetir contraseña" value={repeat} setValue={setRepeat} password />
    <Action label="Registrarme" onPress={submit} busy={busy} />
    <LinkText label="Ya tengo una cuenta" onPress={() => navigation.navigate('Login')} />
  </Layout>;
}

function Forgot({ setRecovery }: { setRecovery: (v: boolean) => void }) {
  const [email, setEmail] = useState(''); const [token, setToken] = useState(''); const [sent, setSent] = useState(false); const [busy, setBusy] = useState(false);
  async function send() {
    if (!emailPattern.test(email.trim())) return Alert.alert('Correo', 'Introduce un correo válido.');
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) throw error;
      setSent(true);
      Alert.alert('Solicitud recibida', 'Si la cuenta existe, recibirás un código de recuperación por correo.');
    } catch (e) { showError(e); } finally { setBusy(false); }
  }
  async function verify() {
    if (!token.trim()) return Alert.alert('Código', 'Escribe el código recibido.');
    setBusy(true);
    try {
      // Mantener visible la pantalla de nueva contraseña cuando llegue SIGNED_IN.
      setRecovery(true);
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(), token: token.trim(), type: 'recovery',
      });
      if (error) { setRecovery(false); throw error; }
    } catch (e) { setRecovery(false); showError(e); } finally { setBusy(false); }
  }
  return <Layout title="Recuperar contraseña" subtitle="Recibe un código para restablecer tu cuenta.">
    <Field label="Correo electrónico" value={email} setValue={setEmail} email />
    <Action label={sent ? 'Reenviar código' : 'Enviar código'} onPress={send} busy={busy} />
    {sent && <>
      <Field label="Código recibido por correo" value={token} setValue={setToken} />
      <Action label="Verificar código" onPress={verify} busy={busy} secondary />
    </>}
    <Text style={styles.note}>Necesitas configurar la plantilla de recuperación de Supabase para que incluya el código (ver README).</Text>
  </Layout>;
}
function Reset({ finish }: { finish: () => Promise<void> }) {
  const [password, setPassword] = useState(''); const [repeat, setRepeat] = useState(''); const [busy, setBusy] = useState(false);
  async function submit() {
    if (password.length < 8) return Alert.alert('Contraseña', 'Utiliza al menos 8 caracteres.');
    if (password !== repeat) return Alert.alert('Contraseñas', 'No coinciden.');
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await finish();
      Alert.alert('Contraseña actualizada', 'Inicia sesión con tu nueva contraseña.');
    } catch (e) { showError(e); } finally { setBusy(false); }
  }
  return <Layout title="Nueva contraseña" subtitle="Tu código se verificó correctamente.">
    <Field label="Nueva contraseña" value={password} setValue={setPassword} password />
    <Field label="Confirmar contraseña" value={repeat} setValue={setRepeat} password />
    <Action label="Guardar contraseña" onPress={submit} busy={busy} />
  </Layout>;
}
function Home({ navigation, session }: { navigation: any; session: Session }) {
  return <Layout title="Bienvenido a PUNTUA" subtitle="Tu acompañamiento académico preuniversitario.">
    <Text style={styles.paragraph}>Cuenta: {session.user.email}</Text>
    <Text style={styles.paragraph}>Próximamente: banco de preguntas, materias, rangos y estadísticas.</Text>
    <Action label="Ver mi perfil" onPress={() => navigation.navigate('Profile')} />
    <Action label="Cerrar sesión" secondary onPress={async () => { const { error } = await supabase.auth.signOut(); if (error) showError(error); }} />
  </Layout>;
}
function Profile({ session }: { session: Session }) {
  const name = session.user.user_metadata?.full_name ?? 'Estudiante';
  return <Layout title="Perfil de estudiante">
    <Text style={styles.paragraph}>Nombre: {String(name)}</Text>
    <Text style={styles.paragraph}>Correo: {session.user.email}</Text>
    <Text style={styles.paragraph}>Rango inicial: Postulante</Text>
    <Text style={styles.note}>El perfil académico y las estadísticas se añadirán en la siguiente fase.</Text>
  </Layout>;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);

  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
  
    async function checkOnboarding() {
      try {
        const value = await AsyncStorage.getItem(
          'puntua_onboarding_completed'
        );
  
        if (active) {
          setOnboardingCompleted(false);////////////////////////////////////////
        }
      } catch (error) {
        console.error('Error al leer onboarding:', error);
        if (active) setOnboardingCompleted(false);
      }
    }
  
    checkOnboarding();
  
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) showError(error);
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  async function finishRecovery() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setRecovery(false);
  }

  async function completeOnboarding() {
    try {
      await AsyncStorage.setItem('puntua_onboarding_completed', 'true');
    } catch (error) {
      console.error('Error al guardar onboarding:', error);
    }
    setOnboardingCompleted(true);
  }

  if (loading || onboardingCompleted === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  }
  
  if (!onboardingCompleted) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onComplete={completeOnboarding} />
      </SafeAreaProvider>
    );
  }

  return <SafeAreaProvider>
    <NavigationContainer key={recovery ? 'recovery' : session ? 'user' : 'guest'}>
      {recovery ? (
        <ResetStack.Navigator screenOptions={navOptions}>
          <ResetStack.Screen name="Reset" options={{ title: 'Restablecer contraseña' }}>
            {() => <Reset finish={finishRecovery} />}
          </ResetStack.Screen>
        </ResetStack.Navigator>
      ) : session ? (
        <UserStack.Navigator screenOptions={navOptions}>
          <UserStack.Screen name="Home" options={{ title: 'Inicio' }}>
            {(props) => <Home {...props} session={session} />}
          </UserStack.Screen>
          <UserStack.Screen name="Profile" options={{ title: 'Mi perfil' }}>
            {() => <Profile session={session} />}
          </UserStack.Screen>
        </UserStack.Navigator>
      ) : (
        <GuestStack.Navigator screenOptions={navOptions}>
          <GuestStack.Screen name="Login" component={Login} options={{ title: 'Acceder' }} />
          <GuestStack.Screen name="Register" component={Register} options={{ title: 'Registro' }} />
          <GuestStack.Screen name="Forgot" options={{ title: 'Recuperación' }}>
            {() => <Forgot setRecovery={setRecovery} />}
          </GuestStack.Screen>
        </GuestStack.Navigator>
      )}
    </NavigationContainer>
  </SafeAreaProvider>;
}
const navOptions = { headerStyle: { backgroundColor: '#111A2D' }, headerTintColor: '#F8FAFC', contentStyle: { backgroundColor: '#0B1120' } };
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B1120' },
  loading: { flex: 1, backgroundColor: '#0B1120', justifyContent: 'center' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingVertical: 30 },
  brand: { color: '#38BDF8', textAlign: 'center', fontSize: 36, fontWeight: '900', letterSpacing: 3, marginBottom: 25 },
  card: { backgroundColor: '#172238', padding: 22, borderRadius: 18 },
  title: { color: '#FFFFFF', fontSize: 25, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#B8C6DA', fontSize: 14, lineHeight: 20, marginBottom: 23 },
  field: { marginBottom: 15 }, label: { color: '#DDE7F3', marginBottom: 7, fontSize: 13 },
  input: { backgroundColor: '#26344D', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 13, color: '#FFFFFF', fontSize: 15 },
  button: { backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  secondaryButton: { backgroundColor: '#355273' }, buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  link: { color: '#70CAFF', textAlign: 'center', paddingVertical: 12, marginTop: 6 },
  paragraph: { color: '#E2E8F0', fontSize: 15, lineHeight: 23, marginBottom: 15 },
  note: { color: '#AEBBD0', fontSize: 12, lineHeight: 18, marginTop: 18 },
});
