/**
 * In-Browser WebM Duration & Metadata Patcher
 * 
 * Chrome's MediaRecorder outputs streaming WebM without duration metadata,
 * causing video players to display 00:00 duration, fail seeking, lag, and freeze.
 * 
 * This module parses the EBML header of the recorded WebM file and injects
 * the accurate Duration tag (Float64 in milliseconds) into the Segment Info block.
 * 
 * Result:
 * - The video player's duration bar moves smoothly in real-time.
 * - Seeking forward and backward works without freezing.
 * - Media players parse timestamps correctly without dropped frames or stutter.
 */

// EBML ID constants
const EBML_ID = 0x1a45dfa3;
const SEGMENT_ID = 0x18538067;
const INFO_ID = 0x1549a966;
const TIMECODE_SCALE_ID = 0x2ad7b1;
const DURATION_ID = 0x4489;

function readVarInt(buffer, offset) {
  const firstByte = buffer[offset];
  if (firstByte === undefined) return null;

  let length = 1;
  let mask = 0x80;
  while ((firstByte & mask) === 0 && length < 8) {
    mask >>= 1;
    length++;
  }

  let value = firstByte & (mask - 1);
  for (let i = 1; i < length; i++) {
    value = (value << 8) | buffer[offset + i];
  }

  return { value, length };
}

/**
 * Patches a WebM Blob with the accurate duration in seconds.
 * Returns a new Blob with the duration header embedded.
 */
export async function fixWebmDuration(blob, durationInSeconds) {
  if (!blob || blob.size === 0) return blob;
  if (!durationInSeconds || durationInSeconds <= 0) return blob;

  try {
    // Read first 1MB of WebM (EBML header and Info block are always in first 100KB)
    const headerSliceSize = Math.min(blob.size, 1024 * 512);
    const headerBuffer = new Uint8Array(await blob.slice(0, headerSliceSize).arrayBuffer());

    // 1. Verify EBML Header
    const ebml = readVarInt(headerBuffer, 0);
    if (!ebml) return blob;

    // Search for Segment element
    let offset = 0;
    let segmentOffset = -1;
    while (offset < headerBuffer.length - 4) {
      if (
        headerBuffer[offset] === 0x18 &&
        headerBuffer[offset + 1] === 0x53 &&
        headerBuffer[offset + 2] === 0x80 &&
        headerBuffer[offset + 3] === 0x67
      ) {
        segmentOffset = offset;
        break;
      }
      offset++;
    }

    if (segmentOffset === -1) return blob;

    // Search for Info element inside Segment
    offset = segmentOffset + 4;
    const segmentLen = readVarInt(headerBuffer, offset);
    if (!segmentLen) return blob;
    offset += segmentLen.length;

    let infoOffset = -1;
    while (offset < headerBuffer.length - 4) {
      if (
        headerBuffer[offset] === 0x15 &&
        headerBuffer[offset + 1] === 0x49 &&
        headerBuffer[offset + 2] === 0xa9 &&
        headerBuffer[offset + 3] === 0x66
      ) {
        infoOffset = offset;
        break;
      }
      offset++;
    }

    if (infoOffset === -1) return blob;

    // Check for existing Duration element inside Info
    offset = infoOffset + 4;
    const infoLen = readVarInt(headerBuffer, offset);
    if (!infoLen) return blob;
    offset += infoLen.length;

    const infoEnd = offset + infoLen.value;
    let durationOffset = -1;
    let timecodeScale = 1000000; // default 1ms

    while (offset < Math.min(infoEnd, headerBuffer.length - 2)) {
      if (headerBuffer[offset] === 0x2a && headerBuffer[offset + 1] === 0xd7 && headerBuffer[offset + 2] === 0xb1) {
        // TimecodeScale
        offset += 3;
        const len = readVarInt(headerBuffer, offset);
        if (len) {
          offset += len.length;
          let scaleVal = 0;
          for (let i = 0; i < len.value; i++) {
            scaleVal = (scaleVal << 8) | headerBuffer[offset + i];
          }
          if (scaleVal > 0) timecodeScale = scaleVal;
          offset += len.value;
          continue;
        }
      }

      if (headerBuffer[offset] === 0x44 && headerBuffer[offset + 1] === 0x89) {
        durationOffset = offset;
        break;
      }
      offset++;
    }

    const durationInMs = durationInSeconds * 1000;

    // If duration element already exists, update its Float value directly
    if (durationOffset !== -1) {
      const len = readVarInt(headerBuffer, durationOffset + 2);
      if (len && (len.value === 4 || len.value === 8)) {
        const valOffset = durationOffset + 2 + len.length;
        const view = new DataView(headerBuffer.buffer, valOffset, len.value);
        if (len.value === 4) {
          view.setFloat32(0, durationInMs, false); // Big endian
        } else {
          view.setFloat64(0, durationInMs, false);
        }
        return new Blob([headerBuffer, blob.slice(headerSliceSize)], { type: blob.type });
      }
    }

    // Otherwise, create a clean Duration tag: 0x44 0x89 (ID) + 0x88 (length 8) + Float64
    const durationTag = new Uint8Array(11);
    durationTag[0] = 0x44;
    durationTag[1] = 0x89;
    durationTag[2] = 0x88; // 8 bytes float64
    const durView = new DataView(durationTag.buffer, 3, 8);
    durView.setFloat64(0, durationInMs, false);

    // Insert durationTag inside Info element
    const insertPos = infoOffset + 4 + infoLen.length;
    const part1 = headerBuffer.slice(0, insertPos);
    const part2 = headerBuffer.slice(insertPos);

    return new Blob([part1, durationTag, part2, blob.slice(headerSliceSize)], { type: blob.type });
  } catch (err) {
    console.warn("Could not patch WebM duration:", err.message);
    return blob;
  }
}
