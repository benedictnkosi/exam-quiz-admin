import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemedText: React.FC<TextProps> = ({ style, ...props }) => {
    const { colors } = useTheme();
    return <Text style={[{ color: colors.text }, style]} {...props} />;
}; 