import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemedView: React.FC<ViewProps> = ({ style, ...props }) => {
    const { colors } = useTheme();
    return <View style={[{ backgroundColor: colors.background }, style]} {...props} />;
}; 