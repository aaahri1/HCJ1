# 문서 요약기 (TextRank)

PDF 또는 DOCX 문서를 업로드하면 **TextRank 알고리즘**으로 핵심 문장을 추출해 요약해주는 웹 앱입니다. 슬라이더로 요약 분량(1~5문장)을 직접 선택할 수 있습니다.

## 주요 기능

- PDF(`.pdf`), Word(`.docx`) 파일 업로드 (드래그 앤 드롭 지원)
- TextRank(TF-IDF + 코사인 유사도 + PageRank) 기반 추출 요약
- 슬라이더로 요약 문장 수(최소 1문장 ~ 최대 5문장) 조절
- 한국어 / 영어 문서 모두 지원

## 동작 원리

1. 업로드된 문서에서 텍스트를 추출합니다. (`pdfplumber`, `python-docx`)
2. 텍스트를 문장 단위로 분리합니다.
3. 각 문장을 TF-IDF 벡터로 표현하고, 문장 간 코사인 유사도로 그래프를 만듭니다.
4. 그래프에 PageRank를 적용해 문장별 중요도 점수를 계산합니다(TextRank).
5. 점수가 높은 상위 N개 문장을 원문 등장 순서대로 정렬해 반환합니다.

핵심 로직은 [summarizer.py](summarizer.py)에 있습니다.

## 프로젝트 구조

```
.
├── app.py              # Flask 서버, 파일 업로드/요약 API
├── summarizer.py        # TextRank 요약 알고리즘
├── requirements.txt      # 의존성 목록
├── templates/
│   └── index.html        # 메인 페이지
└── static/
    ├── style.css          # 스타일
    └── app.js              # 업로드/슬라이더/API 호출 로직
```

## 설치 및 실행

### 1. 가상환경 생성 및 의존성 설치

```bash
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 서버 실행

```bash
python3 app.py
```

### 3. 접속

브라우저에서 `http://127.0.0.1:5001` 접속

## 사용 방법

1. PDF 또는 DOCX 파일을 업로드 영역에 끌어다 놓거나 클릭해서 선택합니다.
2. 슬라이더를 움직여 원하는 요약 문장 수(1~5)를 선택합니다.
3. "요약하기" 버튼을 클릭하면 핵심 문장이 원문 순서대로 표시됩니다.

## 제한 사항

- 최대 업로드 용량: 20MB
- 스캔 이미지로만 이루어진 PDF(텍스트 레이어 없음)는 텍스트를 추출할 수 없습니다.
- 문서의 전체 문장 수가 선택한 요약 문장 수보다 적으면 전체 문장이 그대로 반환됩니다.

## 기술 스택

- **Backend**: Flask
- **문서 파싱**: pdfplumber, python-docx
- **요약 알고리즘**: scikit-learn(TF-IDF), NetworkX(PageRank)
- **Frontend**: 순수 HTML/CSS/JavaScript
