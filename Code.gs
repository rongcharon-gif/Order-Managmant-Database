function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName('Orders') || ss.insertSheet('Orders');
  const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  const headers = ['অর্ডার নম্বর','তারিখ','কাস্টমার','মোবাইল','ঠিকানা','পণ্যসমূহ','পণ্যের মোট','ছাড়','ডেলিভারি চার্জ','ডেলিভারি এলাকা','সর্বমোট','অগ্রিম','বকেয়া','পেমেন্ট','অর্ডার স্ট্যাটাস','নোট','তৈরির সময়'];
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  if (data.type === 'test') {
    sh.appendRow(['CONNECTION-TEST', new Date(), 'সংযোগ পরীক্ষা', '', '', '', '', '', '', '', '', '', '', '', '', '', new Date()]);
    return ContentService.createTextOutput('OK');
  }
  if (data.type === 'status_update') {
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(data.id)) {
        sh.getRange(i + 1, 15).setValue(data.status);
        return ContentService.createTextOutput('STATUS_UPDATED');
      }
    }
  }
  const productText = (data.items || []).map(x => `${x.name} × ${x.qty} @ ${x.price}`).join(' | ');
  sh.appendRow([data.id, data.date, data.customer, data.phone, data.address, productText, data.sub, data.dis, data.del, data.deliveryZone || '', data.tot, data.paid, data.due, data.payment, data.status, data.note, data.createdAt]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true, id: data.id })).setMimeType(ContentService.MimeType.JSON);
}
function doGet() { return ContentService.createTextOutput('রঙচরণ অর্ডার ম্যানেজার: Google Sheets সংযোগ সচল।'); }
