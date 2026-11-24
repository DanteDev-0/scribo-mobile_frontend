import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Mic, FileText } from "lucide-react-native";

import RecordScreen from "../screens/RecordScreen";
import NotesScreen from "../screens/NotesScreen";
import NoteDetailScreen from "../screens/NoteDetailScreen";

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

const ScriboTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#161618",
    card: "#1a1a1c",
    border: "#2a2a2e",
    primary: "#FF9100",
    text: "#F3F4F6",
  },
};

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: true,
        tabBarShowIcon: true,
        tabBarActiveTintColor: "#FF9100",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarPressColor: "rgba(255, 145, 0, 0.12)",
        tabBarIndicatorStyle: {
          backgroundColor: "#FF9100",
          height: 2,
          top: 0,
        },
        tabBarStyle: {
          backgroundColor: "#1a1a1c",
          borderTopColor: "#2a2a2e",
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          textTransform: "none",
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Record"
        component={RecordScreen}
        options={{
          tabBarLabel: "Kaydet",
          tabBarIcon: ({ color }) => <Mic color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{
          tabBarLabel: "Notlarım",
          tabBarIcon: ({ color }) => <FileText color={color} size={22} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={ScriboTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
