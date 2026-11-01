// ============================================================
// Tab Navigator Layout — Tavallin Premium Navigation
// ============================================================

import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, Typography, Shadows } from '../../src/design/tokens';

function HomeIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons
        name={focused ? 'home' : 'home-outline'}
        size={21}
        color={focused ? Colors.charcoal : '#8E8E93'}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>HOME</Text>
    </View>
  );
}

function ExploreIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons
        name={focused ? 'compass' : 'compass-outline'}
        size={21}
        color={focused ? Colors.charcoal : '#8E8E93'}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>EXPLORE</Text>
    </View>
  );
}

function CreateIcon() {
  return (
    <View style={styles.createBtn}>
      <Ionicons name="add" size={24} color="#FAF8F5" />
    </View>
  );
}

function SavedIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons
        name={focused ? 'bookmark' : 'bookmark-outline'}
        size={20}
        color={focused ? Colors.charcoal : '#8E8E93'}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>SAVED</Text>
    </View>
  );
}

function ProfileIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons
        name={focused ? 'person' : 'person-outline'}
        size={20}
        color={focused ? Colors.charcoal : '#8E8E93'}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>PROFILE</Text>
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
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <HomeIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => <ExploreIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: () => <CreateIcon />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ focused }) => <SavedIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FAF8F5',
    borderTopWidth: 1,
    borderTopColor: '#EDE8E0',
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 26 : 8,
    paddingTop: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: '#8E8E93',
  },
  tabLabelActive: {
    fontWeight: '800',
    color: Colors.charcoal,
  },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
  },
});
