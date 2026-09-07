# 이유정의 이력서

이력서 형식의 개인 소개 웹페이지입니다.

---

## 1. 프로젝트 개요

- **목적**: 이름, 소개, 연락처, 보유 기술, 진행 프로젝트를 이력서 형태로 정리해 보여주는 페이지
- **구성**: My info - About - Contact - Skills - Projects 순서의 카드형 레이아웃

---

## 2. 기술 스택

- **마크업**: HTML5
- **스타일링**: CSS3 (Google Fonts - Poppins, Noto Sans KR)
- **에셋**: 프로필 사진, 소셜 아이콘(블로그/이메일/페이스북/모바일), 영상 파일

---

## 3. 디렉토리 구조

```text
.
├── css/
│   └── style.css        # 전체 페이지 스타일
├── images/
│   ├── profile.jpg       # 프로필 사진
│   ├── ico_blog.png
│   ├── ico_email.png
│   ├── ico_facebook.png
│   └── ico_mobile.png
├── dog-running.mp4       # 프로젝트 소개용 영상
├── index.html            # 이력서 페이지
└── readme.md
```

---

## 4. 주요 내용

1. **My info**: 이름, 직업, 나이, 거주지
2. **About**: 한 줄 소개
3. **Contact**: 전화번호, 이메일, SNS 링크
4. **Skills**: HTML, CSS, SASS, Javascript, PHP, Ruby, iOS
5. **Projects**: 소개 영상 및 프로젝트 링크 카드 2건

---

## 5. 실행 방법

별도 설치 과정 없이 `index.html`을 브라우저에서 바로 열면 됩니다.

```bash
python3 -m http.server 8080
```

실행 후 `http://localhost:8080` 접속하여 확인합니다.
