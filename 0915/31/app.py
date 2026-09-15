import io
import uuid

import docx
import pdfplumber
from flask import Flask, jsonify, render_template, request

from summarizer import summarize

ALLOWED_EXTENSIONS = {"pdf", "docx"}
MAX_CONTENT_LENGTH = 20 * 1024 * 1024  # 20MB

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_pdf(file_stream) -> str:
    text_parts = []
    with pdfplumber.open(file_stream) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def extract_text_from_docx(file_stream) -> str:
    document = docx.Document(file_stream)
    return "\n".join(p.text for p in document.paragraphs if p.text.strip())


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/summarize", methods=["POST"])
def api_summarize():
    if "file" not in request.files:
        return jsonify({"error": "파일이 첨부되지 않았습니다."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "파일이 선택되지 않았습니다."}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "PDF 또는 DOCX 파일만 업로드할 수 있습니다."}), 400

    try:
        num_sentences = int(request.form.get("num_sentences", 3))
    except ValueError:
        num_sentences = 3
    num_sentences = max(1, min(5, num_sentences))

    ext = file.filename.rsplit(".", 1)[1].lower()
    file_bytes = io.BytesIO(file.read())
    try:
        if ext == "pdf":
            text = extract_text_from_pdf(file_bytes)
        else:
            text = extract_text_from_docx(file_bytes)
    except Exception:
        return jsonify({"error": "파일을 읽는 중 오류가 발생했습니다. 파일이 손상되지 않았는지 확인해주세요."}), 400

    if not text.strip():
        return jsonify({"error": "문서에서 텍스트를 추출하지 못했습니다. (이미지 기반 PDF일 수 있습니다)"}), 400

    summary_sentences = summarize(text, num_sentences)

    return jsonify(
        {
            "summary": summary_sentences,
            "sentence_count": len(summary_sentences),
            "original_char_count": len(text),
            "filename": file.filename,
            "id": uuid.uuid4().hex,
        }
    )


if __name__ == "__main__":
    app.run(debug=True, port=5001)
