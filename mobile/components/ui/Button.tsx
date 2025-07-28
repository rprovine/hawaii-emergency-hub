import React from 'react';
import { Pressable, Text, PressableProps, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';
import * as Haptics from 'expo-haptics';

const StyledPressable = styled(Pressable);
const StyledText = styled(Text);

interface ButtonProps extends PressableProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  isLoading?: boolean;
  hapticFeedback?: boolean;
}

export const Button = React.forwardRef<any, ButtonProps>(
  ({ 
    variant = 'default', 
    size = 'default', 
    children, 
    disabled,
    isLoading,
    hapticFeedback = true,
    onPress,
    ...props 
  }, ref) => {
    const handlePress = async (e: any) => {
      if (hapticFeedback && !disabled && !isLoading) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress?.(e);
    };

    const getVariantStyles = () => {
      const base = 'rounded-md flex-row items-center justify-center';
      
      switch (variant) {
        case 'default':
          return `${base} bg-primary active:bg-primary/90`;
        case 'destructive':
          return `${base} bg-destructive active:bg-destructive/90`;
        case 'outline':
          return `${base} border border-border bg-transparent active:bg-accent`;
        case 'secondary':
          return `${base} bg-secondary active:bg-secondary/80`;
        case 'ghost':
          return `${base} bg-transparent active:bg-accent`;
        default:
          return base;
      }
    };

    const getSizeStyles = () => {
      switch (size) {
        case 'sm':
          return 'px-3 py-1.5';
        case 'lg':
          return 'px-6 py-3';
        case 'icon':
          return 'p-2';
        default:
          return 'px-4 py-2';
      }
    };

    const getTextColor = () => {
      switch (variant) {
        case 'default':
        case 'destructive':
          return 'text-primary-foreground';
        case 'outline':
        case 'secondary':
        case 'ghost':
          return 'text-foreground';
        default:
          return 'text-foreground';
      }
    };

    const getTextSize = () => {
      switch (size) {
        case 'sm':
          return 'text-sm';
        case 'lg':
          return 'text-base';
        default:
          return 'text-sm';
      }
    };

    return (
      <StyledPressable
        ref={ref}
        onPress={handlePress}
        disabled={disabled || isLoading}
        className={`
          ${getVariantStyles()} 
          ${getSizeStyles()} 
          ${(disabled || isLoading) ? 'opacity-50' : ''}
        `}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'default' || variant === 'destructive' ? '#fff' : '#000'}
          />
        ) : (
          typeof children === 'string' ? (
            <StyledText 
              className={`font-medium ${getTextColor()} ${getTextSize()}`}
            >
              {children}
            </StyledText>
          ) : children
        )}
      </StyledPressable>
    );
  }
);

Button.displayName = 'Button';