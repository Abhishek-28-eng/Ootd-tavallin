import { Tabs, Redirect } from 'expo-router';
import { View, StyleSheet, Text } from 'react-native';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, Typography } from '../../src/design/tokens';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconFocused]}>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.charcoal,
        tabBarInactiveTintColor: Colors.midGray,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="HOME" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => <TabIcon label="EXPLORE" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: () => (
            <View style={styles.createButton}>
              <Text style={styles.createPlus}>+</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ focused }) => <TabIcon label="NOTIF" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="ME" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.warmWhite,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabIconWrap: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tabIconFocused: {},
  tabLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '500',
    color: Colors.midGray,
    letterSpacing: 1,
  },
  tabLabelFocused: {
    color: Colors.charcoal,
    fontWeight: '700',
  },
  createButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.charcoal,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  createPlus: {
    fontSize: 26,
    color: Colors.warmWhite,
    lineHeight: 28,
    fontWeight: '300',
  },
});
