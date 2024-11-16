from flask import Flask, request, jsonify
import google.generativeai as genai
import fitz  # PyMuPDF
import requests
from flask_cors import CORS  # Import CORS
app = Flask(__name__)
CORS(app)
# Configure the Google Generative AI API key
genai.configure(api_key="AIzaSyDFPcEuN34WbSOmlbgofVwdnh2K8C7IBv8")  # Replace with your actual API key

@app.route('/check_resume', methods=['POST'])
def check_resume():
    data = request.json
    resume_url = data.get('resume_url')
    job_title = data.get('job_title')

    if not resume_url or not job_title:
        return jsonify({"error": "Resume URL and job title are required"}), 400

    try:
        # Download the resume
        resume_response = requests.get(resume_url)
        resume_response.raise_for_status()  # Raise an error for bad responses

        # Extract text from the PDF
        resume_text = extract_text_from_pdf(resume_response.content)

        # Generate ATS score using Google Generative AI
        ats_score_response = generate_ats_score(resume_text, job_title)

        return jsonify(ats_score_response), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def extract_text_from_pdf(pdf_content):
    """Extracts text from a PDF file."""
    text = ""
    pdf_document = fitz.open(stream=pdf_content, filetype="pdf")
    for page in pdf_document:
        text += page.get_text()
    pdf_document.close()
    return text

def generate_ats_score(resume_text, job_title):
    """Generates ATS score for the resume using Generative AI."""
    model = genai.GenerativeModel('gemini-1.5-flash')  # Use your preferred model
    prompt = f"I am a HR Check this resume and must give  ATS score  for the position of {job_title}: {resume_text} aslo tell if Candidate is suitable for the job."
    response = model.generate_content(prompt)
    
    feedback = response.text
    score_match = feedback.split('Score: ')
    score = score_match[1].split()[0] if len(score_match) > 1 else "N/A"
    suggestions = feedback.replace(f"Score: {score}", "").strip()

    return {"suggestions": suggestions}

if __name__ == '__main__':
    app.run(debug=True)
