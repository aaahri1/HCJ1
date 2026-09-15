# Smart GIF Studio

브라우저에서 GIF 파일을 무료로 편집할 수 있는 웹 애플리케이션입니다. 모든 처리(디코딩, 리사이징, 인코딩)는 사용자의 브라우저 안에서만 이루어지며, 파일이 서버로 전송되지 않습니다.

## 현재 구현된 기능

### 레이아웃 / 업로드
- 헤더 좌측 로고(`logo.png`) 클릭 시 [nanalab.kr](https://nanalab.kr)로 이동, 우측 브랜드명 "Smart GIF Studio" 표시
- 메인 영역: "Free GIF Editor" 타이틀 + 기능 소개 문구(영문) + 개인정보 보호 안내 카드(영문)
- 드래그 앤 드롭 또는 "Choose File" 버튼을 통한 GIF 업로드
- 업로드 시 타이틀/업로드 영역은 사라지고 편집 화면만 표시
- 반응형 레이아웃: 데스크톱은 좌(GIF)/우(Editor Tools), 모바일(≤768px)은 상/하 배치

### Original GIF 패널
- 업로드된 GIF 미리보기 (레터박스 없이 실제 크기에 맞게 표시)
- 파일 정보 표시: 용량, 해상도, Frame Rate(fps), 총 프레임 수
- 우상단 Download 버튼으로 원본 파일 다운로드
- 패널 제목 좌측 토글 버튼으로 패널 접기/펼치기
- "Choose Another File" 버튼: 새 파일을 불러오면 이전 작업 상태(리사이즈 값, Resized GIF 패널 등)를 모두 초기화

### Editor Tools
9개 도구 버튼(아이콘 포함)이 모두 동작합니다. 각 도구는 버튼 클릭 시 전용 패널로 전환되며, 하단 `Back`/`Go!` 버튼으로 목록 복귀 또는 실행을 합니다. `Go!` 실행이 끝나면 Original GIF 패널은 자동으로 접히고, 좌측에 결과를 보여주는 **Output** 패널이 새로 나타납니다 (결과 이미지/영상, 파일 정보, Download 버튼 제공). 패널 제목의 토글 버튼으로 Original/Output 패널을 언제든 접었다 펼 수 있습니다.

- **Resize** — X축(너비)/Y축(높이) 슬라이더로 크기 조절 (기본값: 원본 크기, 범위: 5%~300%). 두 슬라이더 사이 자물쇠 아이콘으로 종횡비 고정/해제 토글 (잠김 상태에서 한쪽을 움직이면 비율 유지하며 반대쪽도 자동 조절). 결과 파일명: `Resized_원본파일명.gif`
- **Crop** — 1:1 / 4:3 / 3:4 / 16:9 / 9:16 비율 중 선택. `Fill(확대 후 크롭)` 모드는 이미지를 확대해 빈 공간 없이 채우고, `Pad(단색 채우기)` 모드는 남는 공간을 지정한 색상(또는 투명)으로 채움. 결과 파일명: `Cropped_원본파일명.gif`
- **Downsizing** — 세 가지 용량 절감 방법을 체크박스로 독립 선택/조합 가능: 크기 축소(%), 프레임 삭제(N프레임마다 1개만 유지, 남은 프레임의 delay를 합산해 전체 재생 길이 유지), 색상 수 감소(256~2색, GIF 인코더의 팔레트 크기를 직접 줄임). 결과 파일명: `Downsized_원본파일명.gif`
- **Format Convert** — GIF를 JPG(첫 프레임, 품질 조절 가능) 또는 MP4/WebM 영상으로 변환. 영상 변환은 브라우저 내에서 애니메이션을 실시간으로 캔버스에 그리며 녹화하는 방식이라 GIF 재생 시간만큼 소요되며, 브라우저가 MP4 녹화를 지원하지 않으면 자동으로 WebM으로 대체됩니다 (지원 여부는 브라우저마다 다름). 결과 파일명: `원본파일명.jpg` 또는 `원본파일명.mp4`/`.webm`
- **Rotate** — 0°/90°/180°/270° 회전 + 상하/좌우 뒤집기 (동시 적용 가능). 결과 파일명: `Rotated_원본파일명.gif`
- **Optimize** — 연속된 완전히 동일한 프레임을 무손실로 병합(delay 합산)한 뒤 재인코딩. 해상도/색상/화질 변경 없음. 결과 파일명: `Optimized_원본파일명.gif`
- **Reverse** — 프레임 순서를 역방향으로 재배열. 결과 파일명: `Reversed_원본파일명.gif`
- **Speed** — 재생 속도를 0.25x~4x로 조절 (모든 프레임의 delay를 배율에 맞게 재계산). 결과 파일명: `SpeedAdjusted_원본파일명.gif`
- **Cut** — 시작/끝 프레임 슬라이더로 구간을 선택해 그 구간만 추출. 결과 파일명: `Cut_원본파일명.gif`

`Choose Another File`로 새 GIF를 불러오면 위 모든 도구의 설정과 Output 패널이 초기화됩니다.

## 파일 구성

```
.
├── index.html         # 페이지 구조
├── style.css          # 스타일 (밝고 산뜻한 민트/스카이 블루 톤)
├── script.js          # 업로드 / GIF 메타데이터 파싱 / 리사이즈 처리 / UI 로직
├── logo.png           # 헤더 로고 이미지
├── vendor/
│   ├── omggif.js       # GIF 디코딩(프레임/메타데이터) & 인코딩 라이브러리
│   ├── gif.js          # Web Worker 기반 GIF 인코더 (메인 스레드 블로킹 방지)
│   └── gif.worker.js   # gif.js가 사용하는 워커 스크립트
└── README.md
```

## 실행 방법

별도의 빌드 도구나 패키지 설치 없이 순수 HTML/CSS/JS로 작성되어 있습니다. 단, GIF 리사이징 기능은 Web Worker(`vendor/gif.worker.js`)를 사용하므로 **반드시 로컬 서버로 실행**해야 합니다 (`file://` 직접 열기 시 브라우저 보안 정책으로 Worker 로드가 차단될 수 있습니다).

```bash
# 이 폴더에서 실행
python3 -m http.server 8765
```

이후 브라우저에서 `http://localhost:8765` 접속.

## 기술 스택

- HTML5 / CSS3 (Flexbox, 미디어 쿼리)
- Vanilla JavaScript (프레임워크 없음)
- [omggif](https://github.com/deanm/omggif) — GIF89a 디코더/인코더 (MIT)
- [gif.js](https://github.com/jnordberg/gif.js) — Web Worker 기반 GIF 인코더, NeuQuant 색상 양자화 포함 (MIT)
- Google Fonts (Poppins, Inter)

### GIF 처리 파이프라인 (참고)

1. `omggif`로 원본 GIF의 모든 프레임을 disposal method(복원 방식)까지 고려해 완전한 RGBA 이미지로 디코딩 (최초 1회, 이후 모든 도구가 이 결과를 재사용)
2. 도구별로 프레임 배열을 가공: `<canvas>`로 리스케일/크롭/회전, 프레임 순서 변경, 프레임 삭제/병합 등
3. 투명도가 있는 GIF는 알파가 낮은 픽셀을 특수 색상으로 치환해 `gif.js`의 색상 키 투명도로 재매핑
4. `gif.js`가 Web Worker에서 프레임들을 GIF로 인코딩 (진행률은 Go! 버튼에 실시간 표시)
5. Format Convert의 MP4/WebM 변환만 예외적으로 위 파이프라인 대신, 캔버스에 프레임을 실시간으로 그리며 `MediaRecorder`로 녹화하는 방식을 사용

### vendor/gif.worker.js, vendor/gif.js 커스터마이징

Downsizing 도구의 "색상 수 감소" 기능을 위해 `gif.js`/`gif.worker.js`를 소폭 패치했습니다. 원본 라이브러리는 항상 256색 고정 팔레트만 생성하는데, NeuQuant 팔레트 크기를 옵션(`colors`)으로 받아 2~256 사이 원하는 색상 수로 조절할 수 있도록 수정했습니다 (GIF 헤더의 팔레트 크기 필드도 함께 동적으로 계산). 라이브러리 자체의 로직/라이선스는 그대로 유지됩니다.

## 알려진 제한 사항

- MP4 변환은 실시간 녹화 방식이라 GIF 재생 시간만큼 시간이 걸리고, 브라우저의 `MediaRecorder` 지원 범위에 따라 MP4 대신 WebM으로 저장될 수 있습니다.
- Optimize는 완전히 동일한 연속 프레임 병합만 수행하는 무손실 최적화로, 이미 효율적으로 인코딩된 GIF에서는 절감 효과가 크지 않을 수 있습니다.
