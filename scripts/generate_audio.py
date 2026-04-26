import sys
from gtts import gTTS

def generate_audio(text, output_path):
    try:
        tts = gTTS(text=text, lang='en', slow=False)
        tts.save(output_path)
        print(f"Successfully generated audio at {output_path}")
    except Exception as e:
        print(f"Error generating audio: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python generate_audio.py <text> <output_path>")
        sys.exit(1)
        
    text = sys.argv[1]
    output_path = sys.argv[2]
    generate_audio(text, output_path)
