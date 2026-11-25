import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  Search,
  ChevronRight,
  AudioLines,
  RotateCcw,
  X,
} from "lucide-react-native";
import { getLecturesByCourse } from "../api/lectureApi";
import { useUploads } from "../context/UploadContext";

// İleride backend'den GET /api/Course ile dinamik doldurulacak
const DEFAULT_COURSES = ["Mitoloji", "Seramik Çizim", "Prehistorya"];

function getCleanPreview(markdown = "") {
  return markdown
    .replace(/^#+\s.*$/gm, "")
    .replace(/[*_`>#-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    const time = date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `Bugün ${time}`;
  }

  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.max(1, Math.round(seconds / 60));
  return `${mins} dk`;
}

export default function NotesScreen({ navigation }) {
  const { jobs, completedVersion, retryJob, dismissJob } = useUploads();

  const [courses] = useState(DEFAULT_COURSES);
  const [selectedCourse, setSelectedCourse] = useState(DEFAULT_COURSES[0]);
  const [searchText, setSearchText] = useState("");
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchLectures = useCallback(
    async (courseToFetch = selectedCourse, isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        setError(null);
        const data = await getLecturesByCourse(courseToFetch);
        setLectures(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Bağlantı hatası");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedCourse],
  );

  // Ders değiştiğinde veya arka plandaki bir iş bittiğinde yenile
  useEffect(() => {
    fetchLectures(selectedCourse);
  }, [selectedCourse, completedVersion, fetchLectures]);

  // Sekmeye her geçişte güncel listeyi çek
  useFocusEffect(
    useCallback(() => {
      fetchLectures(selectedCourse);
    }, [selectedCourse, fetchLectures]),
  );

  const handleSearchSubmit = () => {
    const trimmed = searchText.trim();
    if (!trimmed) return;
    setSelectedCourse(trimmed);
  };

  // Hem frontend kuyruğundaki hem (ileride) backend'den Processing dönen kayıtları destekler
  const renderProcessingCard = (job) => {
    const isFailed = job.status === "failed";
    const durationText = formatDuration(job.durationSeconds);

    return (
      <View
        key={job.id}
        className={`mb-3 rounded-2xl border overflow-hidden ${
          isFailed
            ? "bg-[#1A1214] border-[#4C1D24]"
            : "bg-[#151518] border-[#2D241C]"
        }`}
      >
        {/* Üst ince turuncu vurgu çizgisi */}
        <View
          className={`h-[2px] w-full ${
            isFailed ? "bg-red-500" : "bg-[#F97316]"
          }`}
        />

        <View className="p-4">
          {/* Üst satır: Ders + Tarih + Süre | Sağda İşleniyor Spinner Rozeti */}
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center flex-1 mr-2">
              <View
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  isFailed ? "bg-red-400" : "bg-[#F97316]"
                }`}
              />
              <Text
                numberOfLines={1}
                className="text-[#F97316] text-[11px] font-bold uppercase tracking-wider"
              >
                {job.courseName}
              </Text>
              <Text className="text-gray-500 text-xs mx-1.5">•</Text>
              <Text className="text-gray-400 text-xs">
                {formatDate(job.createdAt)}
              </Text>
              {durationText && (
                <>
                  <Text className="text-gray-500 text-xs mx-1.5">•</Text>
                  <Text className="text-gray-300 text-xs font-medium">
                    {durationText}
                  </Text>
                </>
              )}
            </View>

            {isFailed ? (
              <View className="px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30">
                <Text className="text-red-400 text-[11px] font-semibold">
                  Hata
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2A1D12] border border-[#4A2E16]">
                <ActivityIndicator size={12} color="#F97316" />
                <Text className="text-[#F97316] text-[11px] font-semibold">
                  İşleniyor
                </Text>
              </View>
            )}
          </View>

          {/* Başlık + Ses İkonu */}
          <View className="flex-row items-center justify-between">
            <Text
              numberOfLines={1}
              className="text-white text-base font-bold flex-1 mr-3"
            >
              {job.subject}
            </Text>
            {!isFailed && (
              <View className="w-8 h-8 rounded-lg bg-[#221A15] items-center justify-center">
                <AudioLines size={16} color="#F97316" />
              </View>
            )}
          </View>

          {/* Alt Bilgi veya Hata Aksiyonları */}
          {isFailed ? (
            <View className="mt-2.5">
              <Text numberOfLines={2} className="text-red-300 text-xs mb-2.5">
                {job.error}
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => retryJob(job.id)}
                  className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F97316]"
                >
                  <RotateCcw size={13} color="#161618" />
                  <Text className="text-[#161618] text-xs font-bold">
                    Tekrar Dene
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => dismissJob(job.id)}
                  className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-[#222226]"
                >
                  <X size={13} color="#9CA3AF" />
                  <Text className="text-gray-300 text-xs font-medium">
                    Kaldır
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text className="text-gray-400 text-xs mt-1.5 leading-4">
              Ses metne dönüştürülüyor ve özet hazırlanıyor... Yeni ders kaydı
              başlatabilirsiniz.
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderLectureCard = ({ item }) => {
    if (item.status === "Processing") {
      return renderProcessingCard({
        id: item.id,
        courseName: item.courseName,
        subject: item.subject,
        createdAt: item.createdAt || item.recordDate,
        durationSeconds: item.durationSeconds,
        status: "processing",
      });
    }

    const durationText = formatDuration(item.durationSeconds);
    const dateText = formatDate(item.createdAt || item.recordDate);
    const preview =
      getCleanPreview(item.formattedNotes) ||
      "Özet içeriği görüntülemek için dokunun.";

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => navigation.navigate("NoteDetail", { record: item })}
        className="mb-3 bg-[#141416] border border-[#222226] rounded-2xl p-4"
      >
        {/* Üst Metadata: Ders • Tarih • Dakika */}
        <View className="flex-row items-center flex-wrap mb-1.5">
          <View className="w-1.5 h-1.5 rounded-full bg-[#F97316] mr-1.5" />
          <Text className="text-[#F97316] text-xs font-semibold">
            {item.courseName}
          </Text>
          {dateText ? (
            <>
              <Text className="text-gray-500 text-xs mx-1.5">•</Text>
              <Text className="text-gray-400 text-xs">{dateText}</Text>
            </>
          ) : null}
          {durationText ? (
            <>
              <Text className="text-gray-500 text-xs mx-1.5">•</Text>
              <Text className="text-gray-200 text-xs font-semibold">
                {durationText}
              </Text>
            </>
          ) : null}
        </View>

        {/* Başlık + Sağ Ok */}
        <View className="flex-row items-center justify-between mb-1.5">
          <Text
            numberOfLines={1}
            className="text-white text-base font-bold flex-1 mr-2"
          >
            {item.subject}
          </Text>
          <ChevronRight size={16} color="#71717A" />
        </View>

        {/* Temiz 2 Satır Önizleme */}
        <Text numberOfLines={2} className="text-gray-400 text-xs leading-5">
          {preview}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0F]" edges={["top"]}>
      <View className="flex-1 px-4 pt-3">
        {/* Başlık + Not Sayısı Rozeti */}
        <View className="flex-row items-center gap-2.5 mb-3.5">
          <Text className="text-white text-2xl font-bold">Ders Notlarım</Text>
          <View className="px-2.5 py-0.5 rounded-full bg-[#1C1C20] border border-[#2A2A30]">
            <Text className="text-gray-400 text-xs font-medium">
              {lectures.length} Not
            </Text>
          </View>
        </View>

        {/* Ders Arama Kutusu */}
        <View className="flex-row items-center bg-[#141416] border border-[#222226] rounded-xl px-3.5 py-2.5 mb-3">
          <Search size={16} color="#6B7280" />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            placeholder="Ders adına göre filtrele..."
            placeholderTextColor="#6B7280"
            className="flex-1 ml-2.5 text-white text-sm p-0"
          />
        </View>

        {/* Dinamik Ders Filtreleri (Tümü yok) */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          {courses.map((course) => {
            const active = selectedCourse === course;
            return (
              <TouchableOpacity
                key={course}
                activeOpacity={0.75}
                onPress={() => setSelectedCourse(course)}
                className={`px-3.5 py-1.5 rounded-full border ${
                  active
                    ? "bg-[#F97316] border-[#F97316]"
                    : "bg-[#141416] border-[#26262B]"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    active ? "text-[#161618]" : "text-gray-300"
                  }`}
                >
                  {course}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Liste */}
        <FlatList
          data={lectures}
          keyExtractor={(item, idx) => String(item.id ?? idx)}
          renderItem={renderLectureCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchLectures(selectedCourse, true)}
              tintColor="#F97316"
            />
          }
          ListHeaderComponent={
            <>
              {/* Arka planda işlenen kayıtlar her zaman listenin en tepesinde */}
              {jobs.map(renderProcessingCard)}

              {error && (
                <View className="mb-3 p-3.5 rounded-xl bg-[#1F1215] border border-red-500/40">
                  <Text className="text-red-400 font-semibold text-sm">
                    Bağlantı Hatası
                  </Text>
                  <Text className="text-red-300 text-xs mt-1">{error}</Text>
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            loading ? (
              <View className="flex-1 items-center justify-center py-16">
                <ActivityIndicator size="large" color="#F97316" />
              </View>
            ) : jobs.length === 0 && !error ? (
              <View className="flex-1 items-center justify-center py-16">
                <Text className="text-gray-500 text-sm">
                  "{selectedCourse}" dersi için henüz kayıt yok.
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}
