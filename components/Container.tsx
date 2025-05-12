import { KeyboardAvoidingView, Platform, ScrollView, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ContainerProps = {
  children: React.ReactNode;
  padded?: boolean;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  backgroundColor?: string;
} & ViewProps;

export const Container = ({ 
  children, 
  padded = true, 
  scrollable = false, 
  keyboardAvoiding = false,
  backgroundColor = 'bg-neutral-50',
  ...viewProps 
}: ContainerProps) => {
  const paddingClass = padded ? 'px-4' : '';
  
  const content = (
    <View 
      {...viewProps} 
      className={`flex-1 ${backgroundColor} ${paddingClass} ${viewProps.className || ''}`}
    >
      {children}
    </View>
  );

  const scrollableContent = scrollable ? (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      {content}
    </ScrollView>
  ) : content;

  const keyboardAvoidingContent = keyboardAvoiding ? (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      {scrollableContent}
    </KeyboardAvoidingView>
  ) : scrollableContent;

  return (
    <SafeAreaView edges={['right', 'left']} className="flex-1">
      {keyboardAvoidingContent}
    </SafeAreaView>
  );
};
