export function parseDaysFromDateString(dateStr: string): number | null {
  if (!dateStr) return null;
  
  // 1. "N박 M일"
  const nBakMDayMatch = dateStr.match(/(\d+)\s*박\s*(\d+)\s*일/);
  if (nBakMDayMatch) return parseInt(nBakMDayMatch[2], 10);
  
  // 2. YYYY-MM-DD ~ YYYY-MM-DD
  const isoDates = [...dateStr.matchAll(/(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/g)];
  if (isoDates.length === 2) {
    const d1 = new Date(isoDates[0][1].replace(/\./g, '-'));
    const d2 = new Date(isoDates[1][1].replace(/\./g, '-'));
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      const diffDays = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) return diffDays + 1;
    }
  }
  
  // 3. M월 D일 ~ M월 D일
  const mdMatches = [...dateStr.matchAll(/(\d+)월\s*(\d+)일/g)];
  if (mdMatches.length === 2) {
    const m1 = parseInt(mdMatches[0][1], 10);
    const d1 = parseInt(mdMatches[0][2], 10);
    const m2 = parseInt(mdMatches[1][1], 10);
    const d2 = parseInt(mdMatches[1][2], 10);
    const date1 = new Date(new Date().getFullYear(), m1 - 1, d1);
    let date2 = new Date(new Date().getFullYear(), m2 - 1, d2);
    if (date2 < date1) date2.setFullYear(date2.getFullYear() + 1);
    const diffDays = Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24)); 
    return diffDays + 1;
  }
  
  // 4. M월 D일부터 D일
  const mMatch = dateStr.match(/(\d+)월\s*(\d+)일.*?(?:~|-|부터).*?(\d+)일/);
  if (mMatch) {
    const start = parseInt(mMatch[2], 10);
    const end = parseInt(mMatch[3], 10);
    if (end >= start) return end - start + 1;
  }
  
  // 5. D일 ~ D일
  const dMatch = dateStr.match(/(?:^|\s)(\d+)일.*?(?:~|-|부터).*?(\d+)일/);
  if (dMatch) {
    const start = parseInt(dMatch[1], 10);
    const end = parseInt(dMatch[2], 10);
    if (end >= start) return end - start + 1;
  }

  return null;
}
