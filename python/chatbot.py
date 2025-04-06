from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForCausalLM
from flask_cors import CORS
import sympy
import torch
import re

app = Flask(__name__)
CORS(app)

# ✅ Load model & tokenizer with optimizations
model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name, torch_dtype=torch.bfloat16)

# ✅ Move model to CPU & enable optimizations
device = torch.device("cpu")
model.to(device)
model.eval()

# ✅ Try compiling model for speed (if supported)
try:
    model = torch.compile(model)  
except:
    pass  # Skip if not supported

@torch.inference_mode()
def generate_reply(prompt):
    """Generates a full response without unnecessary length limits."""
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512).to(device)

    output_ids = model.generate(
        **inputs,
        do_sample=True,
        temperature=0.1,
        top_k=40,
        top_p=0.80,
        repetition_penalty=2.0,
        eos_token_id=tokenizer.eos_token_id,
        pad_token_id=tokenizer.pad_token_id,  # ✅ Prevents weird infinite loops
        stopping_criteria=None  # ✅ Lets model decide when to stop
    )

    reply = tokenizer.decode(output_ids[0], skip_special_tokens=True).strip()
    return reply.split("LeeAI:", 1)[-1].strip()  # ✅ Ensures clean reply

# ✅ FIX: Math Handling Works Properly Now
def evaluate_math(expression):
    """Safely evaluates math expressions and formats output."""
    try:
        result = sympy.sympify(expression).evalf()
        return str(int(result)) if result.is_integer else str(result)
    except:
        return None

# ✅ Improved Math Detection Regex
MATH_REGEX = re.compile(r'^[\d\s\+\-\*/\(\)\^\.]+$')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()

        if not user_message:
            return jsonify({'reply': "Error: Message cannot be empty."}), 400

        # ✅ Check for math first (Prevents AI from interfering)
        if MATH_REGEX.fullmatch(user_message):
            math_result = evaluate_math(user_message)
            if math_result:
                return jsonify({'reply': f"Math Answer: {math_result}"})

        # ✅ Ensure bot introduces itself correctly
        if "your name" in user_message.lower():
            return jsonify({'reply': "My name is LeeAI, your intelligent assistant!"})

        # ✅ Format conversation properly
        formatted_input = f"User: {user_message}\nLeeAI:"
        reply = generate_reply(formatted_input)

        return jsonify({'reply': reply})
    except Exception as e:
        return jsonify({'reply': f"Something went wrong: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, threaded=True)  # ✅ `threaded=True` speeds up requests