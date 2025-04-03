import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemedTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  style?: React.CSSProperties;
}

export const ThemedText: React.FC<ThemedTextProps> = ({ style, ...props }) => {
    const { colors } = useTheme();
    return <span style={{ color: colors.text, ...style }} {...props} />;
}; 