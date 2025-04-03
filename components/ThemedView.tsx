import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemedViewProps extends React.HTMLAttributes<HTMLDivElement> {
  style?: React.CSSProperties;
}

export const ThemedView: React.FC<ThemedViewProps> = ({ style, ...props }) => {
    const { colors } = useTheme();
    return <div style={{ backgroundColor: colors.background, ...style }} {...props} />;
}; 