# রঙচরণ — অর্ডার ও ক্যাশ মেমো অ্যাপ

## এই ভার্সনে যা আছে
- সম্পূর্ণ বাংলা ইন্টারফেস; রঙচরণের মেরুন, ক্রিম ও গোল্ড থিম
- দেওয়া Facebook cover ও logo অ্যাপ এবং ইনভয়েসে ব্যবহার করা হয়েছে
- মোবাইলে ইনস্টলযোগ্য PWA
- পণ্যের নাম ও দাম আগে থেকে সংরক্ষণ; অর্ডারে পণ্য বাছাই করলে দাম অটো বসবে
- এক অর্ডারে একাধিক পণ্য, পরিমাণ, ছাড়, অগ্রিম ও স্বয়ংক্রিয় বিল
- ডেলিভারি চার্জের নির্দিষ্ট অপশন: গাজীপুরের ভিতরে ৳৬০, সারা বাংলাদেশ ৳১৩০
- নতুন অর্ডারে শুধু “অর্ডার কনফার্ম” স্ট্যাটাস
- অর্ডার হিস্টোরিতে পরে স্ট্যাটাস বদল: অর্ডার কনফার্ম, পার্সেল পাঠানো হয়েছে, ডেলিভারি সম্পন্ন, ডেলিভারি ব্যর্থ, রিটার্ন হয়েছে
- অর্ডার সেভের পর কাস্টমার কপি Share; ফোনে Share menu, অন্যথায় কপি করে Messenger/WhatsApp-এ পাঠানো
- ইনভয়েস প্রিন্ট / PDF, অর্ডার সার্চ, পণ্য এডিট/ডিলিট, JSON ব্যাকআপ/রিস্টোর
- ঐচ্ছিক Google Sheets sync; অর্ডার ও পরবর্তী status update Sheet-এ পাঠায়

## অ্যাপ চালু ও মোবাইলে ইনস্টল
1. ZIP extract করুন। সব ফাইল একই folder-এ রাখুন।
2. folder-টি Netlify বা অন্য HTTPS hosting-এ publish করুন। PWA install করতে HTTPS দরকার।
3. Android Chrome-এ প্রকাশিত ওয়েবসাইট খুলে browser menu থেকে **Install app** বা **Add to Home screen** চাপুন।
4. একই browser/device-এ অর্ডার লোকালি সেভ থাকবে। Browser data clear হলে লোকাল ডেটা হারাতে পারে, তাই নিয়মিত Backup Download করুন।

## পণ্য ও দাম যোগ করার নিয়ম
অ্যাপ খুলে **পণ্য ও দাম** ট্যাবে প্রতিটি পণ্যের নাম ও বিক্রয় মূল্য যোগ করুন। এরপর **নতুন অর্ডার**-এ গিয়ে dropdown থেকে পণ্য বাছাই করুন। দাম নিজে থেকেই বসবে; একই অর্ডারে যত খুশি পণ্য যোগ করা যাবে।

## Google Sheet সংযোগ — সহজ ধাপ
আপনি Google Sheet-এর সাধারণ share link দিলেই অটোমেটিক sync চালু হয় না। অ্যাপের দরকার Google Apps Script-এর **Web App URL**।

1. Google Drive-এ একটি Blank Google Sheet তৈরি করুন। নাম দিন `রঙচরণ অর্ডার`।
2. Sheet খুলে **Extensions → Apps Script** চাপুন।
3. Apps Script editor-এ আগে থেকে থাকা কোড মুছে ZIP-এর `Code.gs` ফাইলের সম্পূর্ণ কোড paste করুন। Save করুন।
4. **Deploy → New deployment → Select type → Web app** নির্বাচন করুন।
5. Execute as: **Me** দিন। Who has access: **Anyone** নির্বাচন করলে URL-ধারী যে কেউ endpoint-এ request পাঠাতে পারবে—তাই URL গোপন রাখুন এবং সংবেদনশীল তথ্যের ক্ষেত্রে সতর্ক থাকুন।
6. Deploy চাপুন, প্রয়োজন হলে Google permission authorize করুন। প্রদর্শিত Web App URL কপি করুন; এটি সাধারণত `https://script.google.com/macros/s/.../exec` দিয়ে শেষ হয়।
7. রঙচরণ অ্যাপের **সেটিংস** ট্যাবে URL বসিয়ে **সেটিংস সেভ করুন** চাপুন। এরপর **শিট সংযোগ পরীক্ষা** চাপুন। Google Sheet-এর `Orders` tab-এ `CONNECTION-TEST` row দেখা গেলে সংযোগ হয়েছে।
8. এরপর নতুন অর্ডার সেভ করলে অর্ডারের তথ্য Sheet-এ নতুন row হবে। অর্ডার হিস্টোরি থেকে status বদলালে একই row-এর status update হবে।

**নোট:** browser-এর `no-cors` request থেকে অ্যাপ নিশ্চিত response পড়তে পারে না। তাই Google Sheet-এর `Orders` tab-এ row এসেছে কি না দেখে sync নিশ্চিত করুন।

## ডেটা কোথায় থাকে
অর্ডার, পণ্য ও সেটিংস প্রথমে আপনার browser-এর local storage-এ থাকে। Google Sheet সংযুক্ত করলে অর্ডারের আলাদা cloud copy যায়। একাধিক ডিভাইসে লোকাল অর্ডার নিজে থেকে sync হবে না। Login, courier API, stock auto-deduction ও multi-user access এই সংস্করণে নেই।
