// ===== 설정 =====
// 스프레드시트 URL에서 /d/ 와 /edit 사이에 있는 긴 문자열을 넣으세요.
const SPREADSHEET_ID = '여기에_스프레드시트_ID_입력';
const SHEET_NAME = '시트1';

/**
 * 웹앱 접속 시 index.html을 보여줌
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('교육자료 사용 후기 조사')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * index.html에서 호출하는 함수. 응답을 스프레드시트에 한 줄 추가.
 * formData = { studentId, name, satisfaction, materialTypes: [] }
 */
function submitForm(formData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error('시트를 찾을 수 없습니다. SHEET_NAME 설정을 확인하세요.');
  }

  sheet.appendRow([
    formData.studentId,
    formData.name,
    formData.satisfaction,
    formData.materialTypes.join(', '),
    new Date()
  ]);

  return { ok: true };
}
