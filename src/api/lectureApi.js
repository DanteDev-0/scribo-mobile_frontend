// Visual Studio launchSettings.json içindeki "http" profilinin portunu yaz
const BASE_URL = "http://localhost:5213/api";

export async function getLecturesByCourse(courseName, date = null) {
  const params = new URLSearchParams({ courseName });
  if (date) {
    params.append("date", date);
  }

  const url = `${BASE_URL}/Lecture?${params.toString()}`;
  console.log("GET isteği atılıyor:", url);

  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return await response.json();
}

export function createLectureRecord({
  courseName,
  subject,
  audioUri,
  durationSeconds,
}) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();

    formData.append("CourseName", courseName.trim());
    formData.append("Subject", subject.trim());
    if (durationSeconds != null) {
      formData.append("DurationSeconds", String(durationSeconds));
    }
    formData.append("AudioFile", {
      uri: audioUri,
      name: `lecture_${Date.now()}.m4a`,
      type: "audio/m4a",
    });

    const url = `${BASE_URL}/Lecture`;
    console.log("POST (XHR) isteği atılıyor:", url);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = 120000;
    xhr.setRequestHeader("Accept", "application/json");
    // Content-Type bilerek yazılmıyor; Android boundary'yi otomatik ekler

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Sunucuya bağlanılamadı (XHR Network Error)."));
    };

    xhr.ontimeout = () => {
      reject(new Error("İstek zaman aşımına uğradı."));
    };

    xhr.send(formData);
  });
}
