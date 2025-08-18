import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, SegmentedButtons } from 'react-native-paper';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/styles/theme';
import { AuthStackParamList } from '@/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [telefone, setTelefone] = useState('');
    const [tipo, setTipo] = useState<'buyer' | 'provider' | 'advertiser'>('buyer');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();

    const tipoOptions = [
        { value: 'buyer', label: 'Comprador' },
        { value: 'provider', label: 'Prestador' },
        { value: 'advertiser', label: 'Anunciante' },
    ];

    const handleRegister = async () => {
        if (!nome || !email || !password) {
            Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Erro', 'As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
            return;
        }

        try {
            setIsLoading(true);
            await register({
                nome,
                email,
                password,
                tipo,
                telefone: telefone || undefined,
            });
        } catch (error: any) {
            Alert.alert('Erro', error.response?.data?.message || 'Erro ao criar conta');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="headlineMedium" style={styles.title}>
                        Criar Conta
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Preencha os dados para se cadastrar
                    </Text>

                    <TextInput
                        label="Nome completo *"
                        value={nome}
                        onChangeText={setNome}
                        mode="outlined"
                        style={styles.input}
                    />

                    <TextInput
                        label="Email *"
                        value={email}
                        onChangeText={setEmail}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                    />

                    <TextInput
                        label="Telefone"
                        value={telefone}
                        onChangeText={setTelefone}
                        mode="outlined"
                        keyboardType="phone-pad"
                        style={styles.input}
                    />

                    <Text variant="bodyMedium" style={styles.label}>
                        Tipo de usuário *
                    </Text>
                    <SegmentedButtons
                        value={tipo}
                        onValueChange={(value) => setTipo(value as any)}
                        buttons={tipoOptions}
                        style={styles.segmented}
                    />

                    <TextInput
                        label="Senha *"
                        value={password}
                        onChangeText={setPassword}
                        mode="outlined"
                        secureTextEntry
                        style={styles.input}
                    />

                    <TextInput
                        label="Confirmar senha *"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        mode="outlined"
                        secureTextEntry
                        style={styles.input}
                    />

                    <Button
                        mode="contained"
                        onPress={handleRegister}
                        loading={isLoading}
                        disabled={isLoading}
                        style={styles.button}
                    >
                        Criar Conta
                    </Button>

                    <Button
                        mode="text"
                        onPress={() => navigation.navigate('Login')}
                        style={styles.linkButton}
                    >
                        Já tem conta? Faça login
                    </Button>
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    card: {
        margin: spacing.md,
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
    label: {
        marginBottom: spacing.sm,
        color: colors.text,
    },
    segmented: {
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

export default RegisterScreen;