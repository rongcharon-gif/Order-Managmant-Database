function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName('Orders') || ss.insertSheet('Orders');
    const headers = [
      'অর্ডার নম্বর','তারিখ','কাস্টমার','মোবাইল','ঠিকানা','পণ্যসমূহ',
      'পণ্যের মোট','ছাড়ের পরিমাণ (৳)','ডেলিভারি চার্জ','ডেলিভারি এলাকা',
      'সর্বমোট','অগ্রিম','বকেয়া','পেমেন্ট','অর্ডার স্ট্যাটাস','নোট',
      'তৈরির সময়','ছাড়ের হার (%)'
    ];

    if (sh.getLastRow() === 0) {
      sh.appendRow(headers);
    } else {
      // পুরোনো ১৭-কলামের শিটের ডেটা না সরিয়ে নতুন শতাংশ কলাম যোগ করে।
      const lastCol = Math.max(sh.getLastColumn(), headers.length - 1);
      const currentHeaders = sh.getRange(1, 1, 1, lastCol).getValues()[0];
      if (currentHeaders.indexOf('ছাড়ের হার (%)') === -1) {
        sh.getRange(1, lastCol + 1).setValue('ছাড়ের হার (%)');
      }
    }

    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (data.type === 'test') {
      sh.appendRow([
        data.id || ('CONNECTION-TEST-' + new Date().getTime()),
        new Date(), 'সংযোগ পরীক্ষা', '', '', '', '', '', '', '', '', '', '',
        '', 'টেস্ট', '', new Date(), ''
      ]);
      return ContentService.createTextOutput('OK');
    }

    if (!data.id) {
      return ContentService.createTextOutput('ERROR: Missing order id');
    }

    const lastRow = sh.getLastRow();
    let targetRow = 0;

    // একই Order ID আগে থাকলে নতুন row না বানিয়ে সেই row update হবে।
    if (lastRow >= 2) {
      const ids = sh.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === String(data.id)) {
          targetRow = i + 2;
          break;
        }
      }
    }

    if (data.type === 'status_update') {
      if (targetRow) {
        sh.getRange(targetRow, 15).setValue(data.status || '');
        return ContentService.createTextOutput('STATUS_UPDATED');
      }
      return ContentService.createTextOutput('ORDER_NOT_FOUND');
    }

    const productText = (data.items || []).map(x =>
      `${x.name} × ${x.qty} @ ${x.price}`
    ).join(' | ');

    const row = [
      data.id,
      data.date || '',
      data.customer || '',
      data.phone || '',
      data.address || '',
      productText,
      Number(data.sub || 0),
      Number(data.dis || 0),
      Number(data.del || 0),
      data.deliveryZone || '',
      Number(data.tot || 0),
      Number(data.paid || 0),
      Number(data.due || 0),
      data.payment || '',
      data.status || '',
      data.note || '',
      data.createdAt || new Date(),
      Number(data.discountPercent || 0)
    ];

    if (targetRow) {
      sh.getRange(targetRow, 1, 1, row.length).setValues([row]);
    } else {
      sh.appendRow(row);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, id: data.id }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('রঙচরণ অর্ডার ম্যানেজার: Google Sheets সংযোগ সচল।');
}
