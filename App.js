import "./global.css";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { UploadProvider } from "./src/context/UploadContext";

export default function App() {
  return (
    <UploadProvider>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#161618" />
        <AppNavigator />
      </SafeAreaProvider>
    </UploadProvider>
  );
}
