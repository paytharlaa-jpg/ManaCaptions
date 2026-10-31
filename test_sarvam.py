import os
import sys
from dotenv import load_dotenv
from sarvamai import SarvamAI

# Ensure UTF-8 output in Windows terminal for Telugu characters
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# Load .env file
load_dotenv()

api_key = os.getenv("SARVAM_API_KEY")
if not api_key:
    raise ValueError("SARVAM_API_KEY not found in environment.")

client = SarvamAI(api_subscription_key=api_key)

response = client.chat.completions(
    model="sarvam-105b-conversations",
    messages=[
        {"role": "user", "content": "Hello! Please reply in one short sentence in Telugu."}
    ]
)

reply = response.choices[0].message.content
print("Sarvam AI Response:")
print(reply)
