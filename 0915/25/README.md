# 문서 분석기 (Document Analyzer)

PDF, DOCX 파일을 업로드하면 문서에 포함된 **글자 수(공백 포함/제외), 단어 수, 공백 개수, 이미지 개수**를 알려주는 웹 앱입니다.

## 기술 스택

- Backend: Python, Flask
- PDF 파싱: [pypdf](https://pypi.org/project/pypdf/)
- DOCX 파싱: [python-docx](https://pypi.org/project/python-docx/)
- Frontend: HTML / CSS / Vanilla JavaScript (드래그 앤 드롭 업로드)

## 실행 방법

1. 가상환경 생성 및 활성화 (권장)

   ```bash
   python3 -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   ```

2. 의존성 설치

   ```bash
   pip install -r requirements.txt
   ```

3. 서버 실행

   ```bash
   python3 app.py
   ```

4. 브라우저에서 `http://127.0.0.1:5000` 접속 후 PDF 또는 DOCX 파일을 업로드하면 분석 결과가 표시됩니다.

## 프로젝트 구조

```
.
├── app.py                 # Flask 서버 및 문서 분석 로직
├── requirements.txt        # Python 의존성 목록
├── templates/
│   └── index.html          # 업로드 UI (드래그 앤 드롭 지원)
└── README.md
```

## 분석 항목

| 항목 | 설명 |
| --- | --- |
| 전체 글자 수 (공백 포함) | 줄바꿈을 제외한 전체 텍스트 길이 |
| 전체 글자 수 (공백 제외) | 공백 문자를 제외한 텍스트 길이 |
| 단어 수 | 공백 기준으로 분리한 단어 개수 |
| 공백 개수 | 텍스트에 포함된 공백(space) 문자 개수 |
| 이미지 개수 | 문서 본문에 삽입된 이미지 개수 |

## 참고 사항

- 업로드 가능한 최대 파일 크기는 20MB입니다 (`app.py`의 `MAX_CONTENT_LENGTH`에서 조정 가능).
- PDF의 텍스트 추출은 `pypdf`의 `extract_text()`를 사용하므로, 스캔 이미지로만 구성된 PDF(OCR이 필요한 문서)는 텍스트가 인식되지 않을 수 있습니다.
- DOCX의 이미지 개수는 본문(paragraph)에 삽입된 이미지를 기준으로 집계하며, 머리글/바닥글 이미지는 포함되지 않습니다.
- 업로드된 파일은 분석 후 서버에 저장되지 않고 임시 파일로 처리된 뒤 즉시 삭제됩니다.
