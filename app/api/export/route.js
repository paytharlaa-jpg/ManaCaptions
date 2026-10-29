import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
import { spawn, spawnSync } from "child_process";
import ffmpegPath from "ffmpeg-static";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { getAuthenticatedUser } from "@/lib/authServer";
import { PRICING_RULES } from "@/config/pricing";
import { createJob, updateJobStatus, deductCreditsAtomically, refundCreditsAtomically } from "@/lib/db";

function getFfmpegBinary() {
  const binaryName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  let chosenBinary = null;

  // Prefer the binary supplied by ffmpeg-static.
  if (typeof ffmpegPath === "string" && fsSync.existsSync(ffmpegPath)) {
    chosenBinary = ffmpegPath;
  } else if (
    ffmpegPath?.default &&
    typeof ffmpegPath.default === "string" &&
    fsSync.existsSync(ffmpegPath.default)
  ) {
    chosenBinary = ffmpegPath.default;
  } else {
    // Check the platform-specific package location.
    const localBinary = path.join(process.cwd(), "node_modules", "ffmpeg-static", binaryName);
    if (fsSync.existsSync(localBinary)) {
      chosenBinary = localBinary;
    }
  }

  if (chosenBinary) {
    if (process.platform !== "win32") {
      try {
        fsSync.chmodSync(chosenBinary, 0o755);
      } catch {}
    }
    return chosenBinary;
  }

  return "ffmpeg";
}

// In-memory file cache for processed exports (expires after 15 minutes)
const exportCache = new Map();

function cleanOldExports() {
  const now = Date.now();
  for (const [id, item] of exportCache.entries()) {
    if (now - item.timestamp > 15 * 60 * 1000) {
      exportCache.delete(id);
    }
  }
}

/**
 * Format seconds to SRT timestamp: 00:00:00,000
 */
function toSrtTime(sec) {
  const date = new Date(sec * 1000);
  const hh = String(Math.floor(sec / 3600)).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss},${ms}`;
}

/**
 * Format seconds to VTT timestamp: 00:00:00.000
 */
function toVttTime(sec) {
  const srt = toSrtTime(sec);
  return srt.replace(',', '.');
}

/**
 * GET: Direct, native browser download handler with explicit Content-Disposition filename & Range support
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Diagnostic check for production FFmpeg environment
    if (searchParams.get("check") === "ffmpeg") {
      const ffmpegBinary = getFfmpegBinary();
      let ver = "";
      let enc = "";
      try {
        const v = spawnSync(ffmpegBinary, ["-version"]);
        ver = (v.stdout || v.stderr || "").toString().slice(0, 300);
      } catch (e) {
        ver = e.message;
      }
      try {
        const e = spawnSync(ffmpegBinary, ["-encoders"]);
        enc = (e.stdout || e.stderr || "").toString();
      } catch (e) {
        enc = e.message;
      }
      return NextResponse.json({
        binary: ffmpegBinary,
        version: ver,
        hasLibx264: enc.includes("libx264"),
        hasAac: enc.includes("aac"),
        matchedEncoders: enc.split("\n").filter(l => l.includes("264") || l.includes("aac") || l.includes("h264"))
      });
    }

    const id = searchParams.get("id");
    const requestedName = searchParams.get("name") || "telugu_reel_captioned.mp4";

    if (!id || !exportCache.has(id)) {
      return new NextResponse("Exported file expired or not found. Please render again.", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    const item = exportCache.get(id);
    const safeFilename = requestedName.endsWith(".mp4") ? requestedName : `${requestedName}.mp4`;
    const totalLength = item.buffer.length;

    // Support HTTP Range requests for instant in-browser playback & smooth seeking
    const rangeHeader = request.headers.get("range");
    if (rangeHeader && rangeHeader.startsWith("bytes=")) {
      const parts = rangeHeader.replace("bytes=", "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;

      if (!isNaN(start) && start < totalLength) {
        const safeEnd = Math.min(end, totalLength - 1);
        const chunk = item.buffer.subarray(start, safeEnd + 1);

        return new NextResponse(chunk, {
          status: 206,
          headers: {
            "Content-Range": `bytes ${start}-${safeEnd}/${totalLength}`,
            "Accept-Ranges": "bytes",
            "Content-Length": String(chunk.length),
            "Content-Type": "video/mp4",
            "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`
          }
        });
      }
    }

    return new NextResponse(item.buffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
        "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
        "Content-Length": String(totalLength),
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (err) {
    return new NextResponse("Download error: " + err.message, { status: 500 });
  }
}

/**
 * POST: Handles video transcoding via FFmpeg & Subtitle generation
 */
export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // 1. Video Transcode (Browser recorded frames & audio -> Genuine H.264/AAC MP4)
    if (contentType.includes("multipart/form-data")) {
      const { authenticated, user } = getAuthenticatedUser(request);
      if (!authenticated || !user) {
        return NextResponse.json(
          { ok: false, error: "Please sign in to export captioned videos.", code: "AUTH_REQUIRED" },
          { status: 401 }
        );
      }

      const formData = await request.formData();
      const videoChunk = formData.get("chunk") || formData.get("video") || formData.get("file");
      const filename = formData.get("filename") || "telugu_reel";
      const durationSec = Number(formData.get("duration")) || 30;
      const chunkIndex = Number(formData.get("chunkIndex") ?? 0);
      const totalChunks = Number(formData.get("totalChunks") ?? 1);
      const uploadId = String(formData.get("uploadId") || crypto.randomBytes(8).toString("hex")).replace(/[^a-zA-Z0-9_-]/g, "");

      if (!videoChunk) {
        return NextResponse.json({ ok: false, error: "No video payload received" }, { status: 400 });
      }

      const tmpDir = os.tmpdir();
      const partPath = path.join(tmpDir, `mana_up_${uploadId}.mp4`);

      const chunkBuffer = Buffer.from(await videoChunk.arrayBuffer());

      if (chunkIndex === 0) {
        await fs.writeFile(partPath, chunkBuffer);
      } else {
        await fs.appendFile(partPath, chunkBuffer);
      }

      // If more chunks are expected, acknowledge this chunk and return immediately
      if (chunkIndex < totalChunks - 1) {
        return NextResponse.json({
          ok: true,
          status: "chunk_received",
          chunkIndex,
          totalChunks
        });
      }

      // All chunks have arrived! Proceed to credit check and FFmpeg burn
      const cost = PRICING_RULES.calculateExportCost(durationSec);
      let jobId = null;
      let deduction = null;
      if (cost > 0) {
        try {
          jobId = createJob({
            userId: user.id,
            jobType: "export",
            videoDurationSec: durationSec,
            creditsCost: cost
          });
          deduction = deductCreditsAtomically(user.id, cost, "job", jobId);
        } catch (creditErr) {
          await fs.unlink(partPath).catch(() => {});
          return NextResponse.json(
            {
              ok: false,
              error: creditErr.message || "Insufficient credits",
              code: "INSUFFICIENT_CREDITS",
              cost,
              currentBalance: user.credits_balance
            },
            { status: 402 }
          );
        }
      } else {
        jobId = createJob({
          userId: user.id,
          jobType: "export",
          videoDurationSec: durationSec,
          creditsCost: 0
        });
      }

      try {
        const subtitlesAss = formData.get("subtitlesAss");
        const tempId = crypto.randomBytes(8).toString("hex");
        const outputName = `tc_output_${tempId}.mp4`;
        const subsName = `tc_subs_${tempId}.ass`;

        const outputPath = path.join(tmpDir, outputName);
        const subsPath = path.join(tmpDir, subsName);

        if (subtitlesAss) {
          await fs.writeFile(subsPath, String(subtitlesAss), "utf8");
        }

        // Execute FFmpeg using bundled ffmpeg-static binary
        const ffmpegBinary = getFfmpegBinary();

        // Probe if input media stream includes audio
        let hasAudio = false;
        try {
          const probe = spawnSync(ffmpegBinary, ["-i", partPath]);
          const probeOutput = (probe.stderr ? probe.stderr.toString() : "") + (probe.stdout ? probe.stdout.toString() : "");
          hasAudio = probeOutput.includes("Audio:");
        } catch (probeErr) {
          console.warn("Probe audio note:", probeErr.message);
        }

        // Resilient FFmpeg Execution for CloudLinux / Shared Hosting (Respects LVE Thread Limits)
        const runFfmpegAttempt = (args) => {
          return new Promise((resolve, reject) => {
            const proc = spawn(ffmpegBinary, args, { cwd: tmpDir });
            let stderr = "";
            proc.stderr.on("data", chunk => {
              stderr += chunk.toString();
            });
            proc.on("close", code => {
              if (code === 0) resolve();
              else reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-2000)}`));
            });
            proc.on("error", err => reject(err));
          });
        };

        // Filter chain: scale to even dimensions and burn styled ASS captions
        let vfFilter = "scale=trunc(iw/2)*2:trunc(ih/2)*2";
        if (subtitlesAss) {
          vfFilter += `,ass=${subsName}`;
        }

        // Attempt 1: High-Speed H.264 constrained to 1 thread (bypasses CloudLinux NPROC limit)
        const primaryArgs = [
          "-y",
          "-i", partPath,
          "-vf", vfFilter,
          "-threads", "1",
          "-c:v", "libx264",
          "-pix_fmt", "yuv420p",
          "-preset", "ultrafast",
          "-crf", "22",
          "-x264-params", "threads=1"
        ];
        if (hasAudio) {
          primaryArgs.push("-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-ac", "2");
        }
        primaryArgs.push("-movflags", "+faststart", outputPath);

        try {
          await runFfmpegAttempt(primaryArgs);
        } catch (attempt1Err) {
          console.warn("Attempt 1 (libx264 ultrafast) failed:", attempt1Err.message);

          // Attempt 2: Fallback to MPEG-4 ASP (Built directly into FFmpeg, zero external lib dependency, works on any CloudLinux kernel!)
          const fallbackArgs = [
            "-y",
            "-i", partPath,
            "-vf", vfFilter,
            "-threads", "1",
            "-c:v", "mpeg4",
            "-q:v", "3"
          ];
          if (hasAudio) {
            fallbackArgs.push("-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-ac", "2");
          }
          fallbackArgs.push("-movflags", "+faststart", outputPath);

          try {
            await runFfmpegAttempt(fallbackArgs);
          } catch (attempt2Err) {
            console.warn("Attempt 2 (mpeg4) failed:", attempt2Err.message);

            // Attempt 3: If subtitle filter failed due to font, transcode cleanly with even dimensions
            const rescueArgs = [
              "-y",
              "-i", partPath,
              "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
              "-threads", "1",
              "-c:v", "libx264",
              "-pix_fmt", "yuv420p",
              "-preset", "ultrafast",
              "-crf", "22",
              "-x264-params", "threads=1"
            ];
            if (hasAudio) {
              rescueArgs.push("-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-ac", "2");
            }
            rescueArgs.push("-movflags", "+faststart", outputPath);
            await runFfmpegAttempt(rescueArgs);
          }
        }

        const mp4Buffer = await fs.readFile(outputPath);

        // Clean up temporary files
        await fs.unlink(partPath).catch(() => {});
        await fs.unlink(outputPath).catch(() => {});
        if (subtitlesAss) {
          await fs.unlink(subsPath).catch(() => {});
        }

        // Exact naming requested by creator: {current_filename_without_ext}_manacaption.mp4
        let baseClean = String(filename || "video").trim().replace(/\.[^/.]+$/, "");
        baseClean = baseClean.replace(/_manacaption$/i, "").replace(/_captioned$/i, "");
        const safeBaseName = baseClean.replace(/[^a-zA-Z0-9_-]/g, "_") || "video";
        const safeFilename = `${safeBaseName}_manacaption.mp4`;

        const fileId = crypto.randomBytes(12).toString("hex");
        cleanOldExports();
        exportCache.set(fileId, {
          buffer: mp4Buffer,
          filename: safeFilename,
          mime: "video/mp4",
          timestamp: Date.now()
        });

        if (jobId) updateJobStatus(jobId, "completed");

        return NextResponse.json({
          ok: true,
          fileId,
          filename: safeFilename,
          downloadUrl: `/api/export?id=${fileId}&name=${encodeURIComponent(safeFilename)}`,
          creditsUsed: cost,
          creditsRemaining: deduction ? deduction.newBalance : user.credits_balance
        });
      } catch (err) {
        await fs.unlink(partPath).catch(() => {});
        console.warn("Video export failed, refunding credits:", err.message);
        if (cost > 0) refundCreditsAtomically(user.id, cost, "refund", jobId);
        if (jobId) updateJobStatus(jobId, "failed", err.message);
        return NextResponse.json(
          { ok: false, error: err.message || "Video export transcode failed." },
          { status: 500 }
        );
      }
    }

    // 2. Handle Subtitle Text Export (SRT / VTT)
    const { segments, format, scriptMode, filename: subFilename } = await request.json();

    if (!segments || !Array.isArray(segments)) {
      return NextResponse.json({ ok: false, error: "Missing segments" }, { status: 400 });
    }

    const safeSubBase = String(subFilename || "telugu_reel").trim().replace(/[^a-zA-Z0-9_-]/g, "_");

    if (format === "srt") {
      let srtContent = "";
      segments.forEach((seg, i) => {
        const text = scriptMode === "romanized" && seg.romanizedText ? seg.romanizedText : seg.text;
        srtContent += `${i + 1}\n`;
        srtContent += `${toSrtTime(seg.start)} --> ${toSrtTime(seg.end)}\n`;
        srtContent += `${text}\n\n`;
      });

      const outName = `${safeSubBase}_subtitles.srt`;
      return new NextResponse(srtContent, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${outName}"; filename*=UTF-8''${encodeURIComponent(outName)}`
        }
      });
    }

    if (format === "vtt") {
      let vttContent = "WEBVTT\n\n";
      segments.forEach((seg, i) => {
        const text = scriptMode === "romanized" && seg.romanizedText ? seg.romanizedText : seg.text;
        vttContent += `${toVttTime(seg.start)} --> ${toVttTime(seg.end)}\n`;
        vttContent += `${text}\n\n`;
      });

      const outName = `${safeSubBase}_subtitles.vtt`;
      return new NextResponse(vttContent, {
        headers: {
          "Content-Type": "text/vtt; charset=utf-8",
          "Content-Disposition": `attachment; filename="${outName}"; filename*=UTF-8''${encodeURIComponent(outName)}`
        }
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Export configuration valid"
    });
  } catch (err) {
    console.error("Export API error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
