import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { authService } from '@/services/authService';
import { colors, spacing } from '@/styles/theme';
import { AuthStackParamList } from '@/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert('Erro', 'Digite seu email');
            return;
        }

        try {
            setIsLoading(true);
            await authService.forgotPassword(email);
            Alert.alert(
                'Sucesso',
                'Instruções para redefinir sua senha foram enviadas para seu email',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
        } catch (error: any) {
            Alert.alert('Erro', error.response?.data?.message || 'Erro ao enviar email');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="headlineMedium" style={styles.title}>
                        Esqueci minha senha
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Digite seu email para receber instruções de redefinição
                    </Text>

                    <TextInput
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                    />

                    <Button
                        mode="contained"
                        onPress={handleForgotPassword}
                        loading={isLoading}
                        disabled={isLoading}
                        style={styles.button}
                    >
                        Enviar instruções
                    </Button>

                    <Button
                        mode="text"
                        onPress={() => navigation.navigate('Login')}
                        style={styles.linkButton}
                    >
                        Voltar ao login
                    </Button>
                </Card.Content>
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing.md,
        backgroundColor: colors.background,
    },
    card: {
        padding: spacing.md,
    },
    title: {
        textAlign: 'center',
        marginBottom: spacing.sm,
        color: colors.primary,
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: spacing.lg,
        color: colors.textSecondary,
    },
    input: {
        marginBottom: spacing.md,
    },
    button: {
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    linkButton: {
        marginVertical: spacing.xs,
    },
});

export default ForgotPasswordScreen;