import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import Markdown from "react-native-markdown-display";

const markdownStyles = {
  body: { color: "#E5E7EB", fontSize: 15, lineHeight: 24 },
  heading1: {
    color: "#F9FAFB",
    fontSize: 22,
    fontWeight: "700",
    marginVertical: 10,
  },
  heading2: {
    color: "#FF9100",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  heading3: {
    color: "#F3F4F6",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
  },
  strong: { color: "#FFFFFF", fontWeight: "700" },
  bullet_list: { marginVertical: 6 },
  list_item: { marginVertical: 3 },
  blockquote: {
    backgroundColor: "#1a1a1c",
    borderLeftColor: "#FF9100",
    borderLeftWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 8,
  },
  code_inline: {
    backgroundColor: "#1a1a1c",
    color: "#FF9100",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
};

export default function NoteDetailScreen({ navigation, route }) {
  const record = route.params?.record;

  if (!record) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <Text className="text-gray-400">Not bulunamadı.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg px-5 pt-4">
      <View className="flex-row items-center justify-between mb-4">
        <Pressable
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2 rounded-full active:bg-surface"
        >
          <ArrowLeft color="#F3F4F6" size={22} />
        </Pressable>
        <View className="px-3 py-1 rounded-full bg-surface border border-border">
          <Text className="text-accent text-xs font-semibold uppercase">
            {record.courseName}
          </Text>
        </View>
        <View className="w-8" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <Text className="text-2xl font-bold text-gray-100 mb-4">
          {record.subject}
        </Text>

        <Markdown style={markdownStyles}>
          {record.formattedNotes || "_Özet içeriği boş._"}
        </Markdown>

        <View className="h-12" />
      </ScrollView>
    </SafeAreaView>
  );
}
