import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  onComplete: () => void;
};

const features = [
  {
    title: 'Practica a tu ritmo',
    description: 'Resuelve preguntas de examen y refuerza tus puntos débiles.',
  },
  {
    title: 'Mide tu progreso',
    description: 'Consulta tus resultados y descubre en qué mejorar.',
  },
  {
    title: 'Llega con confianza',
    description: 'Prepárate con constancia para tu próxima evaluación.',
  },
];

export default function OnboardingScreen({ onComplete }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>PUNTUA</Text>
          <Text style={styles.title}>Prepárate para tu examen</Text>
          <Text style={styles.subtitle}>
            Practica, mide tu progreso y llega con confianza el día de la evaluación.
          </Text>
        </View>

        <View style={styles.features}>
          {features.map((feature) => (
            <View key={feature.title} style={styles.feature}>
              <View style={styles.bullet} />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={onComplete}
          accessibilityRole="button"
          accessibilityLabel="Comenzar a usar PUNTUA"
        >
          <Text style={styles.buttonText}>Comenzar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B1120' },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 32 },
  header: { marginTop: 24 },
  brand: {
    color: '#A78BFA',
    textAlign: 'center',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 28,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 12,
  },
  subtitle: {
    color: '#B8C6DA',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  features: { gap: 20, marginVertical: 32 },
  feature: { flexDirection: 'row', alignItems: 'flex-start' },
  bullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7C3AED',
    marginTop: 6,
    marginRight: 12,
  },
  featureText: { flex: 1 },
  featureTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  featureDescription: { color: '#8FA3BF', fontSize: 14, lineHeight: 20 },
  button: {
    backgroundColor: '#7C3AED',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
