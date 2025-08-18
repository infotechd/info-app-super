import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/app/ProfileScreen';
import SettingsScreen from '../screens/app/SettingsScreen';
import NotificationsScreen from '../screens/app/NotificationsScreen';
import { ProfileStackParamList } from '@/types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileNavigator: React.FC = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="ProfileHome"
                component={ProfileScreen}
                options={{ title: 'Perfil' }}
            />
            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ title: 'Configurações' }}
            />
            <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{ title: 'Notificações' }}
            />
        </Stack.Navigator>
    );
};

export default ProfileNavigator;