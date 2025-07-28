import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);

interface BadgeProps extends ViewProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'emergency';
  severity?: 'minor' | 'moderate' | 'severe' | 'extreme';
  children?: React.ReactNode;
}

export const Badge = React.forwardRef<View, BadgeProps>(
  ({ variant = 'default', severity, children, className = '', ...props }, ref) => {
    const getVariantStyles = () => {
      if (severity) {
        // Emergency severity colors
        switch (severity) {
          case 'minor':
            return 'bg-emergency-minor border-emergency-minor/50';
          case 'moderate':
            return 'bg-emergency-moderate border-emergency-moderate/50';
          case 'severe':
            return 'bg-emergency-severe border-emergency-severe/50';
          case 'extreme':
            return 'bg-emergency-extreme border-emergency-extreme/50';
        }
      }

      switch (variant) {
        case 'default':
          return 'bg-primary border-primary/50';
        case 'secondary':
          return 'bg-secondary border-secondary/50';
        case 'destructive':
          return 'bg-destructive border-destructive/50';
        case 'outline':
          return 'bg-transparent border-border';
        case 'emergency':
          return 'bg-destructive border-destructive/50';
        default:
          return 'bg-primary border-primary/50';
      }
    };

    const getTextStyles = () => {
      if (severity && (severity === 'severe' || severity === 'extreme')) {
        return 'text-white';
      }

      switch (variant) {
        case 'default':
        case 'destructive':
        case 'emergency':
          return 'text-primary-foreground';
        case 'secondary':
          return 'text-secondary-foreground';
        case 'outline':
          return 'text-foreground';
        default:
          return 'text-primary-foreground';
      }
    };

    return (
      <StyledView
        ref={ref}
        className={`
          inline-flex items-center rounded-full px-2.5 py-0.5 
          ${getVariantStyles()} 
          ${className}
        `}
        {...props}
      >
        {typeof children === 'string' ? (
          <StyledText 
            className={`text-xs font-semibold ${getTextStyles()}`}
          >
            {children}
          </StyledText>
        ) : children}
      </StyledView>
    );
  }
);

Badge.displayName = 'Badge';