import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  AudioModule,
} from "expo-audio";
import { Mic, Pause, Play, X } from "lucide-react-native";
import { createLectureRecord } from "../api/lectureApi";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUploads } from "../context/UploadContext";

const PRESET_COURSES = ["Mitoloji", "Seramik Çizim", "Prehistorya"];

const BAR_WEIGHTS = [
  0.16, 0.24, 0.34, 0.26, 0.42, 0.56, 0.48, 0.78, 0.94, 0.7, 1.0, 0.86, 0.96,
  0.86, 1.0, 0.7, 0.94, 0.78, 0.48, 0.56, 0.42, 0.26, 0.34, 0.24, 0.16,
];

const QUALITY_PRESETS = [
  {
    id: "long",
    label: "Uzun • 24k",
    maxInfo: "~2 sa+",
    bitRate: 24000,
    sampleRate: 24000,
  },
  {
    id: "balanced",
    label: "Dengeli • 32k",
    maxInfo: "~100 dk",
    bitRate: 32000,
    sampleRate: 24000,
  },
  {
    id: "clear",
    label: "Net • 64k",
    maxInfo: "~50 dk",
    bitRate: 64000,
    sampleRate: 44100,
  },
];

function formatDuration(millis = 0) {
  const totalSeconds = Math.floor(millis / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
    2,
    "0",
  );
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function WaveformVisualizer({ isRecording, isPaused, metering }) {
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    if (!isRecording || isPaused) return;
    const interval = setInterval(() => {
      setPulsePhase((prev) => prev + 0.65);
    }, 100);
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const normalizedLevel =
    typeof metering === "number" && metering > -160
      ? Math.max(0.25, Math.min(1, (metering + 60) / 55))
      : 0.65;

  const active = isRecording && !isPaused;

  return (
    <View className="w-full h-24 bg-[#141416] border border-[#222226] rounded-2xl px-4 flex-row items-center justify-center gap-[5px]">
      {BAR_WEIGHTS.map((weight, index) => {
        const isCenterGroup = index >= 6 && index <= 18;
        const isPeachAccent =
          index === 9 || index === 11 || index === 13 || index === 15;

        let barHeight = 8 + weight * 14;
        if (active) {
          const waveOffset = 0.78 + 0.22 * Math.sin(pulsePhase + index * 0.55);
          barHeight = Math.max(
            10,
            Math.round(weight * normalizedLevel * waveOffset * 68),
          );
        }

        let barColor = "#2E2E33";
        if (active) {
          if (!isCenterGroup) {
            barColor = "#3F3F46";
          } else if (isPeachAccent) {
            barColor = "#FDA4AF";
          } else {
            barColor = "#F97316";
          }
        } else if (isPaused && isCenterGroup) {
          barColor = "#52525B";
        }

        return (
          <View
            key={index}
            style={{
              width: 3.5,
              height: barHeight,
              backgroundColor: barColor,
              borderRadius: 999,
            }}
          />
        );
      })}
    </View>
  );
}

export default function RecordScreen({ navigation }) {
  const [courseName, setCourseName] = useState("Mitoloji");
  const [subject, setSubject] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState(QUALITY_PRESETS[1]);

  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    sampleRate: 24000,
    numberOfChannels: 1,
    bitRate: 32000, // Arasız 2 saat tek kayıt alacaksan 24000 yap
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(audioRecorder, 100);

  const isActiveSession = recorderState.isRecording || isPaused;

  const handleStartRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Mikrofon İzni Gerekli",
          "Ders kaydı alabilmek için mikrofon izni vermelisiniz.",
        );
        return;
      }

      await AudioModule.setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      setIsPaused(false);

      // Seçilen bitrate burada dinamik olarak native kaydediciye verilir
      await audioRecorder.prepareToRecordAsync({
        ...RecordingPresets.HIGH_QUALITY,
        sampleRate: selectedQuality.sampleRate,
        numberOfChannels: 1,
        bitRate: selectedQuality.bitRate,
        isMeteringEnabled: true,
      });

      audioRecorder.record();
    } catch (err) {
      console.log("Kayıt başlatma hatası:", err);
      Alert.alert("Hata", "Ses kaydı başlatılamadı.");
    }
  };
  const handleTogglePause = () => {
    try {
      if (isPaused) {
        audioRecorder.record();
        setIsPaused(false);
      } else {
        audioRecorder.pause();
        setIsPaused(true);
      }
    } catch (err) {
      console.log("Duraklat/Devam hatası:", err);
    }
  };

  const { enqueueUpload } = useUploads();

  const handleStopAndUpload = async () => {
    try {
      // Süreyi stop() öncesinde al (stop sonrası durationMillis sıfırlanabilir)
      const durationSeconds = Math.max(
        1,
        Math.round((recorderState.durationMillis || 0) / 1000),
      );

      await audioRecorder.stop();
      setIsPaused(false);
      const uri = audioRecorder.uri || recorderState.url;

      if (!uri) {
        Alert.alert("Hata", "Ses dosyası oluşturulamadı.");
        return;
      }

      const finalCourse = courseName.trim() || "Genel Ders";
      const finalSubject = subject.trim() || `${finalCourse} Dersi`;

      // Arka plan kuyruğuna at ve beklemeden devam et
      enqueueUpload({
        courseName: finalCourse,
        subject: finalSubject,
        audioUri: uri,
        durationSeconds,
      });

      setSubject("");
      // Not: Tab Navigator'daki rota adın farklıysa "Notes" yerine kendi rota adını yaz
      navigation.navigate("Notes");
    } catch (err) {
      console.log("Kayıt durdurma hatası:", err);
      Alert.alert("Hata", "Kayıt sonlandırılamadı.");
    }
  };

  const handleCancel = async () => {
    try {
      if (recorderState.isRecording || isPaused) {
        await audioRecorder.stop();
      }
    } catch (err) {
      console.log("İptal hatası:", err);
    } finally {
      setIsPaused(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0F]" edges={["top"]}>
      <ScrollView
        className="flex-1 bg-[#0D0D0F]"
        contentContainerStyle={{
          flexGrow: 1,
          padding: 16,
          justifyContent: "space-between",
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Üst Ders & Konu Seçimi */}
        <View className="bg-[#141416] border border-[#222226] rounded-2xl p-3.5">
          <Text className="text-[11px] font-semibold tracking-wider text-gray-400 mb-2">
            DERS ADI
          </Text>

          <View className="flex-row flex-wrap gap-2 mb-2.5">
            {PRESET_COURSES.map((course) => {
              const selected = courseName === course;
              return (
                <TouchableOpacity
                  key={course}
                  activeOpacity={0.75}
                  disabled={isActiveSession || isUploading}
                  onPress={() => setCourseName(course)}
                  className={`px-3.5 py-1.5 rounded-full border ${
                    selected
                      ? "bg-[#F97316] border-[#F97316]"
                      : "bg-[#1C1C1F] border-[#2C2C30]"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      selected ? "text-[#161618]" : "text-gray-300"
                    }`}
                  >
                    {course}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            value={courseName}
            onChangeText={setCourseName}
            editable={!isActiveSession && !isUploading}
            autoCapitalize="words"
            placeholder="Ders adı girin..."
            placeholderTextColor="#6B7280"
            className="bg-[#1A1A1D] border border-[#27272A] rounded-xl px-3.5 py-2.5 text-white text-sm mb-2.5"
          />

          <TextInput
            value={subject}
            onChangeText={setSubject}
            editable={!isActiveSession && !isUploading}
            autoCapitalize="words"
            placeholder="Konu (Örn: Olympos Tanrıları ve Teogoni)"
            placeholderTextColor="#6B7280"
            className="bg-[#1A1A1D] border border-[#27272A] rounded-xl px-3.5 py-2.5 text-white text-sm"
          />
        </View>

        {/* Orta Alan: Sayaç + Canlı Ses Dalgası */}
        {isUploading ? (
          <View className="items-center justify-center my-10">
            <ActivityIndicator size="large" color="#F97316" />
            <Text className="text-white font-semibold text-base mt-4">
              Ses metne dönüştürülüp özetleniyor...
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              Whisper ve GPT cevabı bekleniyor
            </Text>
          </View>
        ) : (
          <View className="items-center my-6">
            <Text
              style={{ fontVariant: ["tabular-nums"] }}
              className="text-white text-5xl font-bold tracking-wider mb-6"
            >
              {formatDuration(recorderState.durationMillis)}
            </Text>

            <WaveformVisualizer
              isRecording={recorderState.isRecording}
              isPaused={isPaused}
              metering={recorderState.metering}
            />
            <View className="w-full mt-5">
              <View className="flex-row items-center justify-between mb-2 px-1">
                <Text className="text-[11px] font-semibold tracking-wider text-gray-400">
                  SES KALİTESİ
                </Text>
                <Text className="text-[11px] text-gray-500">
                  Tek parça maks. {selectedQuality.maxInfo}
                </Text>
              </View>

              <View className="flex-row gap-2">
                {QUALITY_PRESETS.map((preset) => {
                  const active = selectedQuality.id === preset.id;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      activeOpacity={0.75}
                      disabled={isActiveSession}
                      onPress={() => setSelectedQuality(preset)}
                      className={`flex-1 py-2.5 rounded-xl border items-center ${
                        active
                          ? "bg-[#261D17] border-[#F97316]"
                          : "bg-[#141416] border-[#222226]"
                      } ${isActiveSession ? "opacity-40" : ""}`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          active ? "text-[#F97316]" : "text-gray-300"
                        }`}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Alt 3'lü Kontrol Barı */}
        {!isUploading && (
          <View className="flex-row items-start justify-around px-2 pb-4 pt-2">
            {/* SOL: Duraklat / Devam Et */}
            <TouchableOpacity
              activeOpacity={0.75}
              disabled={!isActiveSession}
              onPress={handleTogglePause}
              className={`items-center gap-2 ${!isActiveSession ? "opacity-35" : ""}`}
            >
              <View
                className={`w-16 h-16 rounded-full items-center justify-center border ${
                  isPaused
                    ? "bg-[#261D17] border-[#F97316]"
                    : "bg-[#1E1E22] border-[#2C2C32]"
                }`}
              >
                {isPaused ? (
                  <Play size={22} color="#F97316" fill="#F97316" />
                ) : (
                  <Pause size={22} color="#E5E7EB" />
                )}
              </View>
              <Text className="text-gray-300 text-xs font-medium">
                {isPaused ? "Devam Et" : "Duraklat"}
              </Text>
            </TouchableOpacity>

            {/* ORTA: Başlat -> Kayıt başlayınca Bitir ve Özetle */}
            {!isActiveSession ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleStartRecording}
                className="items-center gap-2 -mt-2"
              >
                <View className="w-20 h-20 rounded-full bg-[#F97316] items-center justify-center border-4 border-[#2E1E14]">
                  <Mic size={32} color="#161618" />
                </View>
                <Text className="text-[#F97316] text-xs font-bold">Başlat</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleStopAndUpload}
                className="items-center gap-2 -mt-2"
              >
                <View className="w-20 h-20 rounded-full bg-[#241B1B] border-2 border-[#6E3B39] items-center justify-center">
                  <View className="w-8 h-8 rounded-lg bg-[#FCA5A5] items-center justify-center">
                    <View className="w-3.5 h-3.5 rounded-sm bg-[#7F1D1D]" />
                  </View>
                </View>
                <Text className="text-[#FCA5A5] text-xs font-bold">
                  Bitir ve Özetle
                </Text>
              </TouchableOpacity>
            )}

            {/* SAĞ: İptal */}
            <TouchableOpacity
              activeOpacity={0.75}
              disabled={!isActiveSession}
              onPress={handleCancel}
              className={`items-center gap-2 ${!isActiveSession ? "opacity-35" : ""}`}
            >
              <View className="w-16 h-16 rounded-full bg-[#1E1E22] border border-[#2C2C32] items-center justify-center">
                <X size={22} color="#9CA3AF" />
              </View>
              <Text className="text-gray-400 text-xs font-medium">İptal</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
