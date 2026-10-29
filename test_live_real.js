const fs = require('fs');
const path = require('path');

async function testRealVideo() {
  const session = Buffer.from(JSON.stringify({ id: 'debug_test_1', email: 'debug@test.com', name: 'Tester' })).toString('base64');
  const videoBuffer = fs.readFileSync(path.join(__dirname, 'public', 'sample_reel.mp4'));
  console.log('Sending real MP4, size:', videoBuffer.length);

  const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,60,&H00FFFFFF,&H002B23BB,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,1,2,20,20,120,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:02.00,Default,,0,0,0,,ManaCaptions Real Live Burn!
`;

  const formData = new FormData();
  formData.append('filename', 'test_real');
  formData.append('duration', '3');
  formData.append('chunkIndex', '0');
  formData.append('totalChunks', '1');
  formData.append('uploadId', 'debug_real_' + Date.now());
  formData.append('subtitlesAss', ass);
  formData.append('chunk', new Blob([videoBuffer], { type: 'video/mp4' }));

  const res = await fetch('https://manacaptions.online/api/export', {
    method: 'POST',
    headers: {
      'Cookie': 'tc_session=' + session
    },
    body: formData
  });

  console.log('HTTP Status:', res.status);
  const text = await res.text();
  console.log('Response body:', text);
}
testRealVideo();
