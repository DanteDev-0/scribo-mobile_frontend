import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotesScreen({ navigation }) {
  return (
    <SafeAreaView className="flex-1 bg-bg px-5 pt-4">
      <Text className="text-2xl font-bold text-gray-100 mb-6">
        Ders Notlarım
      </Text>

      {/* Detay ekranı geçişini test etmek için geçici kart */}
      <Pressable
        onPress={() => navigation.navigate("NoteDetail", { id: 1 })}
        className="bg-surface border border-border rounded-2xl p-4 active:opacity-80"
      >
        <Text className="text-accent text-xs font-semibold mb-1">MİTOLOJİ</Text>
        <Text className="text-gray-100 text-base font-bold">
          Olympos Tanrıları ve Teogoni
        </Text>
        <Text className="text-gray-400 text-sm mt-1">
          Detay ekranını test etmek için dokun
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
