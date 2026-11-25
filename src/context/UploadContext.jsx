import React, { createContext, useContext, useState, useCallback } from "react";
import { createLectureRecord } from "../api/lectureApi";

const UploadContext = createContext(null);

export function UploadProvider({ children }) {
  const [jobs, setJobs] = useState([]);
  const [completedVersion, setCompletedVersion] = useState(0);

  const runUpload = useCallback(async (job) => {
    try {
      await createLectureRecord({
        courseName: job.courseName,
        subject: job.subject,
        audioUri: job.audioUri,
        durationSeconds: job.durationSeconds,
      });

      // Başarılı: geçici kartı kaldır ve Notlarım listesini tetikle
      setJobs((prev) => prev.filter((item) => item.id !== job.id));
      setCompletedVersion((v) => v + 1);
    } catch (err) {
      setJobs((prev) =>
        prev.map((item) =>
          item.id === job.id
            ? {
                ...item,
                status: "failed",
                error: err.message || "Sunucuya bağlanılamadı.",
              }
            : item,
        ),
      );
    }
  }, []);

  const enqueueUpload = useCallback(
    ({ courseName, subject, audioUri, durationSeconds }) => {
      const newJob = {
        id: `job_${Date.now()}`,
        courseName,
        subject,
        audioUri,
        durationSeconds,
        createdAt: new Date().toISOString(),
        status: "processing",
        error: null,
      };

      setJobs((prev) => [newJob, ...prev]);
      // Await ETMİYORUZ: kayıt ekranını kilitlemeden arka planda başlasın
      runUpload(newJob);
    },
    [runUpload],
  );

  const retryJob = useCallback(
    (jobId) => {
      const target = jobs.find((j) => j.id === jobId);
      if (!target) return;

      const updated = { ...target, status: "processing", error: null };
      setJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
      runUpload(updated);
    },
    [jobs, runUpload],
  );

  const dismissJob = useCallback((jobId) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  }, []);

  return (
    <UploadContext.Provider
      value={{ jobs, completedVersion, enqueueUpload, retryJob, dismissJob }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUploads() {
  const ctx = useContext(UploadContext);
  if (!ctx) {
    throw new Error("useUploads must be used inside UploadProvider");
  }
  return ctx;
}
