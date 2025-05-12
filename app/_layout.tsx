import '../global.css';

import { Slot } from 'expo-router';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomTab } from '~/components/BottomTab';
import { usePathname } from 'expo-router';

// Экраны, на которых НЕ нужно показывать BottomTab
const noTabScreens = ['/details', '/order-details'];

export default function Layout() {
  const pathname = usePathname();
  const showBottomTab = !noTabScreens.some(screen => pathname.includes(screen));

  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-neutral-50">
        <StatusBar style="dark" />
        <View className="flex-1">
          <Slot />
        </View>
        {showBottomTab && <BottomTab />}
      </View>
    </SafeAreaProvider>
  );
}
