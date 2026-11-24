import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";

export default function NoteDetailScreen({ navigation }) {
  return (
    <SafeAreaView className="flex-1 bg-bg px-5 pt-4">
      <View className="flex-row items-center gap-3 mb-6">
        <Pressable
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2 rounded-full active:bg-surface"
        >
          <ArrowLeft color="#F3F4F6" size={22} />
        </Pressable>
        <Text className="text-gray-100 text-lg font-semibold">Not Detayı</Text>
      </View>

      <Text className="text-gray-400">
        Özet ve Ham Transkript buraya gelecek
      </Text>
    </SafeAreaView>
  );
}
