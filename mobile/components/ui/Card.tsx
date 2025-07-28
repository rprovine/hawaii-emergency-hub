import React from 'react';
import { View, Text, ViewProps, TextProps } from 'react-native';
import { styled } from 'nativewind';

// Shadcn/ui-inspired Card components for React Native
const StyledView = styled(View);
const StyledText = styled(Text);

interface CardProps extends ViewProps {
  variant?: 'default' | 'destructive' | 'outline';
}

export const Card = React.forwardRef<View, CardProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-card border-border',
      destructive: 'bg-destructive border-destructive',
      outline: 'bg-transparent border-border'
    };

    return (
      <StyledView
        ref={ref}
        className={`rounded-lg border p-4 shadow-sm ${variantStyles[variant]} ${className}`}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<View, ViewProps>(
  ({ className = '', ...props }, ref) => (
    <StyledView
      ref={ref}
      className={`flex flex-col space-y-1.5 ${className}`}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<Text, TextProps>(
  ({ className = '', ...props }, ref) => (
    <StyledText
      ref={ref}
      className={`text-lg font-semibold leading-none tracking-tight text-foreground ${className}`}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<Text, TextProps>(
  ({ className = '', ...props }, ref) => (
    <StyledText
      ref={ref}
      className={`text-sm text-muted-foreground ${className}`}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<View, ViewProps>(
  ({ className = '', ...props }, ref) => (
    <StyledView ref={ref} className={`pt-0 ${className}`} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<View, ViewProps>(
  ({ className = '', ...props }, ref) => (
    <StyledView
      ref={ref}
      className={`flex flex-row items-center pt-0 ${className}`}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';