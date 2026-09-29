# PublicationAuthor — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| id | UUID | Y | المعرف |  |
| publicationId | FK | Y | المنشور |  |
| researcherId | FK | N | باحث داخلي |  |
| authorName | String | Y | اسم المؤلف |  |
| authorOrder | Integer | Y | الترتيب | UNIQUE(publicationId,authorOrder)؛ يبدأ من 1 |
| correspondingAuthor | Boolean | Y | هل مؤلف مراسل | default false؛ يمكن أكثر من واحد |
| affiliationOrgUnitId | FK | N | الانتماء الداخلي وقت النشر | أو affiliationText |
| affiliationText | String(500) | N | انتماء خارجي/نصي | يلزم أحد حقلي الانتماء |
| linkedAt | Timestamp | N | وقت ربط مؤلف خارجي بباحث | لا يغير authorOrder |
