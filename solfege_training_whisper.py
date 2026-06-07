import random
import re
import gradio as gr
from faster_whisper import WhisperModel

model = WhisperModel("base", device="cpu", compute_type="int8")

stages = {
    "Day 1": ["145", "236", "467", "126", "357"],
    "Day 2-3": ["2567", "1457", "2367", "1356", "1245"],
    "Day 4-6": ["12456", "23567", "13567", "23467", "34567"],
    "Day 7-10": ["234567", "134567", "123467", "123567", "124567"],
    "Day 11-15": ["1234567"]
}

aliases = {
    "1": ["1", "one", "won", "do", "doh", "dou"],
    "2": ["2", "two", "too", "to", "re", "ray", "rei"],
    "3": ["3", "three", "mi", "me"],
    "4": ["4", "four", "for", "fa", "far"],
    "5": ["5", "five", "sol", "so", "soul", "sou"],
    "6": ["6", "six", "la"],
    "7": ["7", "seven", "si", "see", "sea", "ti", "tea", "she"]
}

current_sequence = ""


def normalize(text):
    text = text.lower()

    digits = re.findall(r"[1-7]", text)
    if len(digits) >= 2:
        return "".join(digits)

    words = re.findall(r"[a-z]+", text)
    result = []

    for w in words:
        for num, names in aliases.items():
            if w in names:
                result.append(num)
                break

    return "".join(result)


def new_question(stage, length):
    global current_sequence

    length = int(length)
    group = random.choice(stages[stage])
    current_sequence = "".join(random.choice(group) for _ in range(length))

    return (
        " ".join(current_sequence),
        None,      # remove previous recording
        "",        # result
        "",        # transcript
        ""         # detail
    )


def grade_audio(audio):
    global current_sequence

    if not current_sequence:
        return "Please create a new question first.", "", ""

    if audio is None:
        return "No audio received.", "", ""

    segments, info = model.transcribe(
        audio,
        language="en",
        beam_size=5,
        temperature=0,
        condition_on_previous_text=False,
        initial_prompt="The speaker is saying a sequence of numbers from one to seven, or solfege syllables: do re mi fa sol la si."
    )

    transcript = " ".join(seg.text.strip() for seg in segments)
    answer = normalize(transcript)
    correct = current_sequence

    result = "✅ Correct!" if answer == correct else "❌ Wrong."

    detail = f"""Recognized text:
{transcript}

Correct:
{" ".join(correct)}

You gave:
{" ".join(answer)}

Position check:
"""

    n = max(len(correct), len(answer))
    for i in range(n):
        c = correct[i] if i < len(correct) else "_"
        a = answer[i] if i < len(answer) else "_"

        if c == a:
            detail += f"\n{i+1}. ✅ {a}"
        else:
            detail += f"\n{i+1}. ❌ you said {a}, correct {c}"

    return result, transcript, detail


css = """
#question_box textarea {
    font-size: 56px !important;
    font-weight: 600 !important;
    text-align: center !important;
    letter-spacing: 14px !important;
    line-height: 1.6 !important;
}
"""

with gr.Blocks(css=css) as demo:
    gr.Markdown("# 1-7 Note Recognition Trainer with Whisper")

    with gr.Row():
        stage = gr.Dropdown(
            list(stages.keys()),
            value="Day 1",
            label="Training stage"
        )
        length = gr.Number(
            value=10,
            precision=0,
            label="Sequence length"
        )

    new_btn = gr.Button("New Question")

    sequence = gr.Textbox(
        label="Random sequence",
        interactive=False,
        elem_id="question_box"
    )

    gr.Markdown("### Record your answer. When you stop recording, grading starts automatically.")

    audio = gr.Audio(
        sources=["microphone"],
        type="filepath",
        label="Recording"
    )

    result = gr.Textbox(label="Result")
    transcript = gr.Textbox(label="Whisper transcript")
    detail = gr.Textbox(label="Detailed grading", lines=14)

    new_btn.click(
        new_question,
        inputs=[stage, length],
        outputs=[sequence, audio, result, transcript, detail]
    )

    # Automatically grade when you stop recording
    audio.stop_recording(
        grade_audio,
        inputs=audio,
        outputs=[result, transcript, detail]
    )

demo.launch()